<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Guida per gli agenti — Scale e serpenti di coppia

Gioco da tavolo digitale per due persone in videochiamata: "scale e serpenti" in bianco e nero con domande,
sfide ed economia di monete e stelle. Uso privato, Next.js su Vercel + Supabase.

## Prima di iniziare

1. Leggi [docs/README.md](docs/README.md): indica quali documenti servono per il tuo task.
2. Trova il task in [docs/roadmap.md](docs/roadmap.md) e segnalo `[~]` (in corso).
3. [docs/decisions.md](docs/decisions.md) prevale su [docs/specs.md](docs/specs.md). Se un caso non è coperto,
   non inventare in silenzio: scegli la soluzione più semplice e registrala come decisione **Derivata**, oppure chiedi.

## Comandi

| Comando                              | Cosa fa                                                        |
| ------------------------------------ | -------------------------------------------------------------- |
| `pnpm dev`                           | Server di sviluppo (http://localhost:3000)                     |
| `pnpm check`                         | typecheck + lint + test: **deve passare prima di ogni commit** |
| `pnpm test` / `pnpm test:watch`      | Vitest                                                         |
| `pnpm build`                         | Build di produzione                                            |
| `pnpm format`                        | Prettier                                                       |
| `pnpm db:start` / `db:stop`          | Supabase locale (serve Docker acceso)                          |
| `pnpm db:reset`                      | Riapplica migrazioni e `supabase/seed.sql`                     |
| `pnpm db:types`                      | Rigenera `src/lib/supabase/database.types.ts`                  |
| `pnpm content:seed`                  | Rigenera `supabase/seed.sql` da `src/content`                  |
| `pnpm supabase migration new <nome>` | Nuova migrazione                                               |

## Struttura

```
docs/                    specifiche, decisioni, regole, architettura, roadmap, reference visive
scripts/                 script tsx (seed dei contenuti, creazione stanza)
supabase/                config.toml, migrations/, seed.sql (generato)
public/rive/             file .riv
src/
  app/                   rotte: pagine sottili e route API sottili
    (room)/r/[code]/     lobby, sheet, game, diary
    api/                 rooms/join, games/[gameId]/actions
  engine/                MOTORE PURO: tipi, RULES, reducer, helper tabellone (+ test)
  content/               contenuti versionati + schemi Zod
  server/                solo server: accesso, pipeline delle azioni, pesca domande
  lib/                   env, client Supabase (browser, server, admin)
  features/              UI per area: board, dice, cards, lobby, sheet, minigames, diary, presence
  art/                   illustrations/ (SVG React), rive/ (wrapper con segnaposto)
  components/ui/         componenti UI generici
```

## Regole non negoziabili

1. **Le regole di gioco stanno solo in `src/engine`** e girano solo sul server. Il client invia azioni e anima gli
   eventi; non ricalcola mai l'esito di una mossa.
2. **Il motore è puro:** niente React, Next, Supabase, `Math.random`, `Date` (usa `EngineContext`). ESLint lo impone.
3. **Ogni numero di bilanciamento sta in `RULES`** (`src/engine/config.ts`), mai scritto nel reducer.
4. **Le risposte della scheda non escono mai dal server** (né nello stato, né negli eventi, né in un componente client).
   `src/lib/supabase/admin.ts` e `src/server/**` non si importano da codice client (ESLint lo impone).
5. **I client non scrivono nel database:** ogni scrittura passa da una route API → `src/server`. Le policy RLS sono
   solo di lettura.
6. **Schema del DB solo tramite migrazioni** in `supabase/migrations` (mai modifiche a mano sul remoto).
7. **Id dei contenuti stabili:** non rinumerare mai le domande.
8. **Test:** ogni regola implementata nel motore ha un test Vitest.

## Convenzioni

- Codice, tipi, tabelle e colonne in **inglese**; testi dell'interfaccia, commenti e documentazione in **italiano**
  (con accenti corretti). Termini: [docs/glossary.md](docs/glossary.md).
- TypeScript strict, niente `any`: per i dati esterni usa Zod. Import con alias `@/`.
- File in kebab-case, componenti React in PascalCase. Server Components di default; `"use client"` solo dove serve.
- Stile: Tailwind con i token di `globals.css` (`bg-paper`, `text-ink`, `font-display`, `player-red`...).
  Bianco e nero; il colore è solo dei giocatori ([docs/design.md](docs/design.md)).
- Commit piccoli, messaggio in inglese all'imperativo (es. `Add ladder question rule`), con l'id del task nel corpo.

## Chiudere un task

1. `pnpm check` verde (e `pnpm build` se hai toccato `src/app`).
2. Aggiorna [docs/roadmap.md](docs/roadmap.md) a `[x]` con una riga di note se hai lasciato qualcosa di non ovvio.
3. Aggiorna i documenti toccati dal cambiamento (regole, architettura, modello dati, design).
