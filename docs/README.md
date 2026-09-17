# Documentazione

Ordine di lettura per chi arriva sul progetto (persona o agente):

| #   | Documento                                         | Quando leggerlo                                                                          |
| --- | ------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | [specs.md](specs.md)                              | Visione e specifiche originali. Non si modifica, tranne l'elenco delle decisioni aperte. |
| 2   | [decisions.md](decisions.md)                      | Decisioni prese dopo le specifiche: **prevalgono** sulle specifiche.                     |
| 3   | [roadmap.md](roadmap.md)                          | Cosa è fatto, cosa c'è da fare, id dei task.                                             |
| 4   | [architecture.md](architecture.md)                | Prima di toccare `src/server`, `src/app/api`, Supabase o Realtime.                       |
| 5   | [rules.md](rules.md)                              | Prima di toccare `src/engine`: regolamento completo e parametri.                         |
| 6   | [data-model.md](data-model.md)                    | Prima di scrivere una migrazione o una query.                                            |
| 7   | [content.md](content.md)                          | Prima di scrivere domande, sfide o disposizioni.                                         |
| 8   | [design.md](design.md) + [reference/](reference/) | Prima di lavorare su UI, SVG o Rive.                                                     |
| —   | [glossary.md](glossary.md)                        | Corrispondenze tra termini italiani e nomi nel codice.                                   |

Altri documenti:

- [local-testing.md](local-testing.md): verifica in locale con Docker del lavoro fatto dagli agenti (task `[L]`).
- [../HERMES.md](../HERMES.md): istruzioni per l'agente Hermes, che costruisce senza Docker.

**Regola di manutenzione:** se cambi una regola, un flusso o una tabella, aggiorna il documento corrispondente
nello stesso commit. Se prendi una decisione nuova, aggiungila in `decisions.md`.
