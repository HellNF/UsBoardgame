# features/

Componenti UI divisi per area, uno per cartella. Possono importare da `@/engine` (tipi e helper puri),
`@/content`, `@/art`, `@/components/ui`, `@/lib/supabase/browser`. Non importano mai `@/server` né `@/lib/supabase/admin`.

| Cartella  | Contenuto                                                                               | Fase |
| --------- | --------------------------------------------------------------------------------------- | ---- |
| board     | Tabellone SVG, celle, scale e serpenti generati dalla disposizione, pedine in movimento | 1, 6 |
| dice      | Pulsante e animazione dei dadi                                                          | 1, 6 |
| cards     | Carte domanda, sfida, imprevisto, offerta stella                                        | 3-5  |
| lobby     | Impostazioni della serata e stato "pronto"                                              | 0    |
| sheet     | Compilazione della scheda                                                               | 3    |
| minigames | Tris, forza 4, memory, quiz, riflessi (un componente per `challenge.minigame`)          | 4    |
| diary     | Diario e archivio                                                                       | 5    |
| presence  | Indicatore dell'altro giocatore (Realtime presence)                                     | 2    |
