# Contenuti

Domande, sfide, oggetti, imprevisti e disposizioni sono file nel repo ([D-15](decisions.md#d-15--contenuti-come-file-nel-repo--seed)).

| File                                   | Contenuto                                            | Schema                                  |
| -------------------------------------- | ---------------------------------------------------- | --------------------------------------- |
| `src/content/questions/<categoria>.ts` | domande di una categoria                             | `questionSchema`                        |
| `src/content/challenges.ts`            | carte sfida                                          | `challengeSchema`                       |
| `src/content/items.ts`                 | nomi ed effetti degli oggetti (prezzi in `RULES`)    | tipo `ItemId`                           |
| `src/content/events.ts`                | nomi ed effetti degli imprevisti (numeri in `RULES`) | tipo `EventCardId`                      |
| `src/content/boards/*.ts`              | disposizioni del tabellone                           | tipo `BoardLayout` + validatore (F1-01) |

## Domande

```ts
{
  id: "deep-004",            // <categoria>-<3 cifre>, mai rinumerato
  category: "deep",          // tastes | memories | future | deep | funny
  level: 2,                  // 1 leggera · 2 personale · 3 intima (conta solo per deep)
  kind: "short",             // multiple | short | open
  text: "Di cosa ho più paura?",          // in partita, detta da chi è interrogato
  sheetText: "Di cosa hai più paura?",    // nella scheda (obbligatorio se non open)
  options: ["…", "…"],                    // solo multiple, 2-6 opzioni generiche
}
```

**Obiettivi del mazzo iniziale** (task F3-04): 30 domande per categoria = 150. Circa 8 per categoria nella scheda
(`multiple` o `short`, ~40 in totale) e 22 aperte. Le profonde distribuite su tutti e tre i livelli (almeno 8 per livello).

**Stile:**

- Italiano colloquiale, dare del tu. `text` in prima persona di chi è interrogato ("il mio", "ci siamo").
- Una domanda = una sola risposta verificabile (per `multiple` e `short`).
- `multiple`: opzioni generiche valide per chiunque, mutuamente esclusive.
- `short`: risposta che si scrive in poche parole e si giudica facilmente con "giusta / quasi / sbagliata".
- `open`: stimola un racconto da fare in videochiamata; niente sì/no.
- Livello 3: intime ma mai imbarazzanti o dolorose da imporre; niente temi di salute, ex o denaro.

## Sfide

Vedi `challengeSchema` e i vincoli in [rules.md § Sfide](rules.md#sfide):
`trial` ⇒ `judge`; `duel` ⇒ `automatic` (con `minigame`) o `double_confirm`; `snakeFlash` ⇒ durata ≤ 30 s.
Serve un numero sufficiente di carte `snakeFlash` (almeno 6) perché le sfide lampo non si ripetano.

## Pubblicare i contenuti

- **Locale:** `pnpm content:seed` (rigenera `supabase/seed.sql`, da committare) e poi `pnpm db:reset`.
- **Produzione:** `supabase db push` non esegue il seed. Da creare (task F3-05): `pnpm content:push`, che fa
  upsert dei contenuti sul progetto remoto con la secret key. Gli upsert non cancellano mai righe.
