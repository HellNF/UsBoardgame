import type { CheckLine } from "./checks";
import type { ContentDrift } from "./content-publish";

/**
 * Il controllo prima della serata (K3, `pnpm doctor`).
 *
 * Oggi la risposta a «questo ambiente è pronto per una partita vera?» era sparsa in sei verifiche a
 * mano nel Registro. Qui sta la **parte pura**: cosa si controlla, con che parole si racconta, e cosa
 * suggerire quando è rosso. Il guscio (`scripts/check-ready.ts`) parla con Supabase e gli passa i fatti.
 *
 * Le cose che il doctor **non può sapere** — un interruttore nel dashboard — non diventano righe
 * verdi per finta: sono righe `manual`, elencate per chi le guarda.
 */

/* ------------------------------------------------------------------------------------------------
 * Migrazioni
 * ---------------------------------------------------------------------------------------------- */

/** Un oggetto che una migrazione crea, controllabile dall'API (una tabella o una funzione). */
export type MigrationObject = {
  kind: "table" | "rpc";
  name: string;
  /**
   * Argomenti con cui si chiama la funzione per accorgersi che c'è. Sono **finti e innocui**: un id
   * che non esiste, quindi la funzione non trova nessuna riga e non scrive niente. Servono perché
   * PostgREST risponde «funzione inesistente» anche quando la funzione c'è ma gli argomenti non
   * tornano: senza, il controllo direbbe rosso su un database sano.
   */
  args?: (probeId: string) => Record<string, unknown>;
};

export type MigrationProbe = {
  /** Nome del file in `supabase/migrations/`. */
  file: string;
  /** Cosa si può controllare dall'API. Vuoto quando la migrazione non è controllabile. */
  objects?: MigrationObject[];
  /** Perché non si controlla dall'API: finisce in una riga `manual`, non in un rosso finto. */
  manual?: string;
};

/**
 * La tabella dei controlli: una voce per migrazione.
 *
 * Aggiungere una migrazione senza aggiungere la sua voce **fa fallire i test** (`doctor.test.ts`
 * confronta questa tabella con i file sul disco): così non si dimentica un controllo nuovo.
 */
export const MIGRATION_PROBES: MigrationProbe[] = [
  {
    file: "20260917000000_init.sql",
    objects: [
      { kind: "table", name: "rooms" },
      { kind: "table", name: "game_events" },
      { kind: "rpc", name: "current_room_id" },
      {
        kind: "rpc",
        name: "apply_game_action",
        args: (id) => ({
          p_game_id: id,
          p_expected_version: -1,
          p_new_state: {},
          p_events: [],
        }),
      },
    ],
  },
  {
    file: "20260918120000_lobby_atomic.sql",
    objects: [
      {
        kind: "rpc",
        name: "set_lobby_ready",
        args: (id) => ({
          p_game_id: id,
          p_seat: 1,
          p_ready: false,
          p_sheets_incomplete: false,
          p_new_state: {},
        }),
      },
      { kind: "rpc", name: "start_lobby_game", args: (id) => ({ p_game_id: id, p_new_state: {} }) },
    ],
  },
  {
    file: "20260918130000_finish_game.sql",
    manual:
      "rimpiazza `apply_game_action` con `create or replace`: dall'API non si distingue quale versione è applicata — guarda `pnpm supabase migration list`",
  },
  {
    file: "20260918180000_private_realtime.sql",
    manual:
      "le policy su `realtime.messages` non si leggono dall'API: il canale lo prova `pnpm check:realtime`",
  },
];

/** Le migrazioni sul disco che non hanno una voce nella tabella dei controlli. */
export function migrationsWithoutProbe(files: readonly string[]): string[] {
  const known = new Set(MIGRATION_PROBES.map((probe) => probe.file));
  return files.filter((file) => !known.has(file));
}

/** Cosa ha trovato il guscio per una migrazione: gli oggetti che mancano (vuoto = applicata). */
export type MigrationOutcome = { file: string; missing: string[] };

/** Una riga per migrazione: `ok`, `fail` con cosa manca, o `manual` quando non si può controllare. */
export function migrationLines(
  outcomes: readonly MigrationOutcome[],
  probes: readonly MigrationProbe[] = MIGRATION_PROBES,
): CheckLine[] {
  return probes.map((probe) => {
    const label = `migrazione ${probe.file}`;
    if (probe.manual) {
      return { label, status: "manual", detail: probe.manual };
    }
    const outcome = outcomes.find((entry) => entry.file === probe.file);
    const missing = outcome?.missing ?? [];
    if (missing.length > 0) {
      return {
        label,
        status: "fail",
        detail: `manca ${missing.join(", ")}`,
        fix: "il database è indietro: `pnpm db:reset` in locale, `pnpm supabase db push` sul remoto",
      };
    }
    return {
      label,
      status: "ok",
      detail: (probe.objects ?? []).map((object) => object.name).join(", "),
    };
  });
}

/* ------------------------------------------------------------------------------------------------
 * Accesso anonimo, contenuti, stanze
 * ---------------------------------------------------------------------------------------------- */

/** L'accesso anonimo: senza, nessuno entra (sul remoto è spento di default, ed è già costato un giro). */
export function anonymousLine(ok: boolean, detail: string): CheckLine {
  return ok
    ? { label: "accesso anonimo", status: "ok", detail }
    : {
        label: "accesso anonimo",
        status: "fail",
        detail,
        fix: "accendilo a mano dal dashboard (Authentication → Sign In / Providers → Anonymous sign-ins): non arriva dalle migrazioni",
      };
}

/** Le tre tabelle dei contenuti: pubblicati e identici ai file (`content:push` è il rimedio). */
export function contentLines(drifts: readonly ContentDrift[]): CheckLine[] {
  return drifts.map((drift) => {
    const label = `contenuti · ${drift.table}`;
    if (drift.missing.length === 0 && drift.different.length === 0 && drift.extra.length === 0) {
      return { label, status: "ok", detail: "pubblicati e identici ai file" };
    }
    const parts = [
      ...(drift.missing.length > 0 ? [`${drift.missing.length} da pubblicare`] : []),
      ...(drift.different.length > 0 ? [`${drift.different.length} diversi`] : []),
      ...(drift.extra.length > 0 ? [`${drift.extra.length} in database e non nei file`] : []),
    ];
    const ids = [...drift.missing, ...drift.different].slice(0, 3);
    return {
      label,
      status: drift.missing.length > 0 || drift.different.length > 0 ? "fail" : "warn",
      detail: `${parts.join(", ")}${ids.length > 0 ? ` (${ids.join(", ")})` : ""}`,
      fix: "`pnpm content:push` (i tabelloni già pubblicati non si riscrivono: vedi D-78)",
    };
  });
}

/** Una stanza con due posti: senza, non c'è dove giocare. */
export function roomLines(rooms: readonly { code: string; seats: number }[]): CheckLine[] {
  const playable = rooms.filter((room) => room.seats >= 2);
  if (playable.length > 0) {
    return [
      {
        label: "stanze",
        status: "ok",
        detail: `${playable.length} con due posti (${playable
          .slice(0, 3)
          .map((room) => room.code)
          .join(", ")})`,
      },
    ];
  }
  return [
    {
      label: "stanze",
      status: "fail",
      detail:
        rooms.length === 0
          ? "nessuna stanza nel database"
          : `nessuna con due posti (${rooms.map((room) => `${room.code}: ${room.seats} posto`).join(", ")})`,
      fix: "`pnpm room:create --code COPPIA42 --name1 … --name2 …` (chiede la password a terminale)",
    },
  ];
}

/* ------------------------------------------------------------------------------------------------
 * RLS
 * ---------------------------------------------------------------------------------------------- */

/** Cosa ha risposto il database alla sessione anonima, per ognuna delle tre prove. */
export type RlsOutcome = {
  /** `rooms` si legge da una sessione anonima? Non deve. */
  rooms: "empty" | "visible";
  /** Una scrittura diretta da client? Non deve passare. */
  write: "denied" | "allowed" | "other";
  /** `apply_game_action` da client? Non deve passare. */
  action: "denied" | "allowed" | "missing" | "other";
  /** Il messaggio vero del database, quando serve a capire. */
  detail?: string;
};

/** Tre righe: le stanze non si leggono, i client non scrivono, l'azione non si chiama da fuori. */
export function rlsLines(outcome: RlsOutcome): CheckLine[] {
  const lines: CheckLine[] = [];

  lines.push(
    outcome.rooms === "empty"
      ? {
          label: "RLS · rooms non si legge",
          status: "ok",
          detail: "la sessione anonima non vede nessuna stanza",
        }
      : {
          label: "RLS · rooms non si legge",
          status: "fail",
          detail: "una sessione anonima legge `rooms`",
          fix: "controlla le policy di `rooms` nella migrazione 20260917000000_init.sql",
        },
  );

  lines.push(
    outcome.write === "denied"
      ? {
          label: "RLS · i client non scrivono",
          status: "ok",
          detail: "la scrittura diretta è rifiutata",
        }
      : {
          label: "RLS · i client non scrivono",
          status: "fail",
          detail:
            outcome.write === "allowed"
              ? "una scrittura diretta dal client è passata!"
              : `risposta inattesa${outcome.detail ? `: ${outcome.detail}` : ""}`,
          fix: "le scritture passano solo dalle route API: la RLS deve rifiutare `insert`/`update`/`delete` ai client",
        },
  );

  lines.push(
    outcome.action === "denied"
      ? {
          label: "RLS · l'azione non si chiama da fuori",
          status: "ok",
          detail: "`apply_game_action` rifiutata alla sessione anonima",
        }
      : {
          label: "RLS · l'azione non si chiama da fuori",
          status: "fail",
          detail:
            outcome.action === "allowed"
              ? "il motore ha accettato una chiamata dal client!"
              : outcome.action === "missing"
                ? "la funzione non c'è (migrazione mancante?)"
                : `risposta inattesa${outcome.detail ? `: ${outcome.detail}` : ""}`,
          fix: "il grant di `apply_game_action` deve restare al solo `service_role` (migrazione 20260917000000_init.sql)",
        },
  );

  return lines;
}

/* ------------------------------------------------------------------------------------------------
 * Quello che si guarda a mano
 * ---------------------------------------------------------------------------------------------- */

/** Le cose che il doctor non può provare: si elencano, con dove guardare. */
export function manualLines(): CheckLine[] {
  return [
    {
      label: "canale della stanza",
      status: "manual",
      detail: "private: true + policy su realtime.messages, con due sessioni vere: `pnpm check:realtime`",
    },
    {
      label: "«Allow public access» in Realtime Settings",
      status: "manual",
      detail:
        "è un interruttore del dashboard, non una migrazione: se resta acceso un canale pubblico con lo stesso topic vede lo stesso (lo dice `pnpm check:realtime`)",
    },
  ];
}
