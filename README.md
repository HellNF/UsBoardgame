# Scale e serpenti di coppia

Un gioco "scale e serpenti" digitale per due, in bianco e nero illustrato, da giocare a distanza in videochiamata:
100 caselle, ognuna un pretesto per conoscersi meglio o sfidarsi.

- Visione e specifiche: [docs/specs.md](docs/specs.md)
- Documentazione completa: [docs/README.md](docs/README.md)
- Guida per agenti e sviluppatori: [AGENTS.md](AGENTS.md)
- Stato dei lavori: [docs/roadmap.md](docs/roadmap.md)

## Avvio rapido

Requisiti: Node 22+, pnpm 11, Docker (per Supabase locale).

```bash
pnpm install
pnpm db:start                 # stampa URL e chiavi locali
cp .env.example .env.local    # e incolla i valori
pnpm db:reset                 # migrazioni + contenuti
pnpm dev
```

Stack: Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Supabase (Postgres, Realtime, Auth anonima) ·
Zod · Motion · Rive · Vitest.
