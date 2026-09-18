import type { CheckLine } from "./checks";

/**
 * La prova a due sessioni sul canale Realtime (K1).
 *
 * La parte pura: cosa fare di quello che la prova ha visto. Lo script `check-realtime.ts` crea la
 * stanza, apre le sessioni e aspetta; qui si decide **cosa significa** l'esito e cosa scrivere.
 *
 * La distinzione è quella scritta nel Registro di J3, e serve a non perdere tempo davanti a un
 * rosso:
 *  - **mosse ferme** → la policy su `realtime.messages` è troppo stretta (o il topic non torna). Sul
 *    canale viaggiano mosse ed eventi **e** la presenza: se non arriva niente, non è «solo la
 *    presenza», è la partita a distanza che non funziona;
 *  - **mosse arrivate, presenza no** → è la presenza (l'`insert` con `extension = 'presence'`, o
 *    `channel.track`) a non passare;
 *  - **la terza sessione entra** → il canale non è privato, o il progetto non richiede
 *    l'autorizzazione.
 */

export type RealtimeRun = {
  /** Il canale provato (`room:<id>`). */
  topic: string;
  /** L'azione di prova: applicata dal motore, oppure rifiutata (e allora non si può provare il resto). */
  action: "applied" | "refused";
  actionDetail: string;
  /** Millisecondi fra l'azione e l'arrivo all'altro posto. `null` = non è arrivato niente. */
  movesMs: number | null;
  moveTimeoutMs: number;
  /** Ogni posto vede l'altro collegato? */
  presenceSeen: boolean;
  /** La terza sessione (senza sessione in quella stanza) è rimasta fuori dal canale privato? */
  closed: boolean;
  closedDetail: string;
  /** Quanti posti ha visto la terza sessione aprendo un canale **pubblico** con lo stesso topic. */
  publicSeatsSeen: number;
  /** La stanza usa e getta e tutto quello che ha creato sono spariti? */
  cleanedUp: boolean;
};

/** Le righe di esito della prova, pronte da stampare. */
export function diagnose(run: RealtimeRun): CheckLine[] {
  const lines: CheckLine[] = [];

  lines.push(
    run.action === "applied"
      ? { label: "azione di prova", status: "ok", detail: run.actionDetail }
      : {
          label: "azione di prova",
          status: "fail",
          detail: run.actionDetail,
          fix: "la prova ha bisogno di una partita che accetti la prima mossa: guarda il messaggio sopra (contenuti pubblicati? seme dei contenuti?)",
        },
  );

  if (run.action !== "applied") {
    // Senza azione applicata non c'è niente da ricevere: le altre righe non dicono nulla.
    return lines;
  }

  lines.push(
    run.movesMs === null
      ? {
          label: "le mosse arrivano all'altro posto",
          status: "fail",
          detail: `niente entro ${Math.round(run.moveTimeoutMs / 1000)} s`,
          fix: `la policy su realtime.messages è troppo stretta (o il topic non torna): sul canale ${run.topic} viaggiano mosse ed eventi E la presenza, quindi «non arriva niente» non è la presenza — è la partita a distanza. Guarda la migrazione 20260918180000_private_realtime.sql e il nome del canale in src/features/presence/use-room-realtime.ts`,
        }
      : {
          label: "le mosse arrivano all'altro posto",
          status: "ok",
          detail: `ricevute in ${run.movesMs} ms dal posto che non ha giocato`,
        },
  );

  lines.push(
    run.presenceSeen
      ? { label: "presenza", status: "ok", detail: "ogni posto vede l'altro collegato" }
      : {
          label: "presenza",
          status: "fail",
          detail: "i due posti non si vedono",
          fix:
            run.movesMs === null
              ? "la presenza viaggia sullo stesso canale delle mosse: con le mosse ferme la causa è la policy di lettura (`select`) su realtime.messages, non la presenza — guarda la riga sopra"
              : "le mosse passano e la presenza no: è l'`insert` su realtime.messages con `extension = 'presence'` (seconda policy della migrazione), oppure `channel.track` che fallisce — guarda la console per l'errore del canale",
        },
  );

  lines.push(
    run.closed
      ? { label: "canale chiuso a chi non è della stanza", status: "ok", detail: run.closedDetail }
      : {
          label: "canale chiuso a chi non è della stanza",
          status: "fail",
          detail: run.closedDetail,
          fix: "una sessione senza posto in questa stanza è entrata nel canale: controlla `config: { private: true }` nel client e le policy su realtime.messages",
        },
  );

  if (run.publicSeatsSeen > 0) {
    lines.push({
      label: "canale pubblico con lo stesso topic",
      status: "fail",
      detail: `una terza sessione vede ${run.publicSeatsSeen} posti collegati`,
      fix: "il canale privato funziona, ma chi apre un canale **pubblico** con lo stesso nome vede lo stesso: spegni «Allow public access» in Realtime Settings (dashboard del progetto) — è l'unico pezzo che non passa da una migrazione",
    });
  } else {
    lines.push({
      label: "canale pubblico con lo stesso topic",
      status: "ok",
      detail: "una terza sessione non vede nessuno",
    });
  }

  lines.push(
    run.cleanedUp
      ? { label: "pulizia", status: "ok", detail: "stanza usa e getta e righe collegate rimosse" }
      : {
          label: "pulizia",
          status: "warn",
          detail: "qualcosa è rimasto nel database",
          fix: "cancella a mano la stanza e la partita della prova (gli id sono stampati sopra)",
        },
  );

  return lines;
}

/** Una promessa che si risolve quando serve (per aspettare un evento del canale). */
export type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  settled: () => boolean;
};

export function deferred<T>(): Deferred<T> {
  let settled = false;
  let release!: (value: T) => void;
  const promise = new Promise<T>((resolve) => {
    release = (value: T) => {
      settled = true;
      resolve(value);
    };
  });
  return { promise, resolve: release, settled: () => settled };
}

/** Aspetta che una condizione diventi vera, controllandola ogni `intervalMs`. */
export async function waitFor(
  predicate: () => boolean,
  timeoutMs: number,
  intervalMs = 200,
): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    if (predicate()) return true;
    if (Date.now() >= deadline) return predicate();
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

/**
 * La stessa promessa, ma con un tempo massimo: un `sleep` a caso non dice niente, un tempo massimo
 * sì («non è arrivato niente entro 15 secondi»).
 */
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error instanceof Error ? error : new Error(String(error)));
      },
    );
  });
}
