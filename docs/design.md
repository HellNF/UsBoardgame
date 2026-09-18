# Estetica e asset

Sintesi operativa di [specs.md § Estetica](specs.md#estetica). Reference visive in [reference/](reference/).

## Principi

1. **Bianco e nero per il gioco.** Carta `#F2F2F0`, inchiostro `#1A1A1A`. Nessun grigio, nessuna ombra, nessun
   gradiente. Le **illustrazioni** sono l'eccezione: hanno una tavolozza propria, piatta (D-75).
2. **Il colore delle pedine è solo delle pedine:** gettone, evidenziazione del turno e punteggi. Il tabellone lo
   colorano i disegni delle caselle, non le pedine.
3. **Geometria, non decorazione:** il tipo di casella si riconosce dalla forma (vedi tabella).
4. **Tratto spesso e campiture piene** per le illustrazioni, con le tinte della tavolozza (D-75).
5. **Una schermata sola** (≥ 1024 × 768, D-16): la partita non fa scorrere la pagina; il tabellone si adatta
   all'altezza disponibile e, se serve, scorre solo il pannello di destra. Quando si apre una carta, però, la
   schermata diventa **l'attività**: la carta prende tutto e il tabellone sparisce (D-76). Chi ha il turno si riconosce a colpo
   d'occhio — bordo pieno della riga, pallino pieno del colore del giocatore, etichetta "Tocca a te" — e non dal
   solo colore.

## Token (`src/app/globals.css`)

| Token Tailwind | Valore           | Uso                                |
| -------------- | ---------------- | ---------------------------------- |
| `paper`        | `#F2F2F0`        | fondo celle e pagina               |
| `ink`          | `#1A1A1A`        | testo, bordi, cornice, celle piene |
| `player-red`   | `#D83B2C`        | giocatore                          |
| `player-blue`  | `#2F4B9E`        | giocatore                          |
| `player-green` | `#2E5E3E`        | giocatore (proposta, da validare)  |
| `player-ochre` | `#C08A2B`        | giocatore (proposta, da validare)  |
| `art-*`        | 12 tinte piatte  | solo illustrazioni (D-75)          |
| `font-display` | Playfair Display | titoli, sempre in corsivo          |
| `font-sans`    | Space Grotesk    | testo e numeri                     |

## Tabellone (SVG, `src/features/board`)

- Un solo `<svg viewBox="0 0 1000 1000">`: cella = 100 × 100 unità; coordinate da `cellToCoord`
  (riga 0 in basso: `y = (9 - row) * 100`).
- Bordi delle celle sottili (≈ 2 unità); cornice esterna spessa (≈ 16) con angoli arrotondati; numero della
  casella piccolo in alto a sinistra (Space Grotesk).
- Livelli, dal basso: celle → decorazioni multi-cella (`decorations`) → illustrazioni → scale → serpenti →
  cornice → **numeri e simboli delle caselle** → pedine.
- **Numeri e simboli sopra scale e serpenti:** il numero della casella, il simbolo della stella, i cerchi delle
  monete e l'illustrazione della categoria si disegnano nell'ultimo strato, ognuno con un **alone del colore della
  casella** (carta, o inchiostro sulle caselle sfida) frapposto fra il segno e ciò che c'è sotto. Dove una scala o
  un serpente passano su una casella, numero e simbolo restano leggibili: senza l'alone finiscono sotto la linea.

- **Scale:** due montanti neri **sottili** (tratto 8, montanti a 32 unità di distanza), pioli bianchi, generate
  dagli estremi `from`/`to`.
- **Peso delle linee:** scale e serpenti si attraversano il tabellone senza dominarlo. Erano una scala larga 62
  unità e un serpente 26 con onde da 30 — masse nere che coprivano mezze caselle vicine e rendevano il tabellone
  illeggibile; ora sono 32 e 16 con onde da 14 (`LADDER_*` e `SNAKE_*` in `src/engine/board-geometry.ts`, usate
  sia dal disegno sia dalle misure). Una linea sottile non deve diventare invisibile: sotto l'inchiostro ci va un
  **alone di carta** (3 unità per lato), altrimenti su una casella sfida, che è nera, restano solo i pioli e le
  macchie bianche a galleggiare.
- Le **pedine** stanno sopra tutto e possono coprire numeri e disegni: è voluto, una pedina deve dire dove sei.
  **Inclinazione minima 18° sull'orizzontale**, per le scale e per i serpenti: sotto quella soglia la linea si
  legge come una sbarra piatta e non come una salita o una discesa. Il numero viene dalla `classic`, dove la
  linea più piatta è esattamente 18° (la scala 51→67); il generatore di F7-02 ne produceva il 17% sotto i 20°,
  fino a 8°, ed è un vincolo che gli manca.
- **Serpenti:** curva di Bézier sinuosa generata dagli estremi, corpo nero sottile a macchie, coda che si assottiglia,
  testa con un occhio e la lingua. La generazione deve essere deterministica per disposizione (stesso tabellone =
  stessa forma).
- **Decorazioni multi-cella** (`decorations` nella disposizione): forme **piene** in inchiostro, contenute nel
  gruppo di caselle indicato con un margine di 12 unità dai bordi — `disc` (disco), `crescent` (falce),
  `hill` (mezzo disco appoggiato in basso), `diamond` (rombo). Stanno sotto scale,
  serpenti e numeri: dove passa una scala o un serpente vincono loro, e il numero della casella resta leggibile
  grazie all'alone (A1). Niente più segnaposto a filo (G1, D-65).
  Tre vincoli su dove e come (D-65): si mettono su caselle che **nessuna scala e nessun serpente attraversa**
  (due neri pieni uno sull'altro si fondono in una macchia), **mai su una casella di bordo** (la cornice è spessa
  16 unità e si disegna dopo: si mangia il margine), e sono **piene, mai anelli** (l'alone del numero morde sempre
  l'angolo in alto a sinistra: una forma piena lo regge, una fascia sottile si spezza). Le caselle legali le
  calcolano `crossedCells` e `isBorderCell` in `src/engine/board-geometry.ts`, non l'occhio: è la stessa misura che
  usa il generatore di disposizioni (F7-02).
- Le caselle domanda e stella portano **l'illustrazione** del registro (`src/art/illustrations`) dentro un tondo di
  carta, nello strato dei numeri: è l'alone di A1, e il numero della casella si disegna sopra a tutto.

| Tipo di casella | Resa                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| Domanda         | bianca + illustrazione a colori della categoria                           |
| Sfida           | nera piena, numero in bianco                                              |
| Imprevisto      | metà nera in diagonale                                                    |
| Monete          | cerchio nero pieno (+3) o vuoto (−2), anche come semicerchio su più celle |
| Stella          | illustrazione di stella                                                   |
| Libera          | bianca vuota (può avere una decorazione piena)                            |

## Illustrazioni SVG (`src/art/illustrations`)

- Un componente per file: `tastes-bottle.tsx` esporta `TastesBottle`; registro `index.ts` con
  `IllustrationId → componente` (`Illustration` rende un id con `createElement`, o niente se l'id non c'è).
- `viewBox="0 0 100 100"`, margine interno di 12 unità; il **contorno** è `currentColor` (inchiostro) e i
  riempimenti sono i token `--color-art-*` della tavolozza delle illustrazioni, o `var(--color-paper)` (D-75):
  niente sfumature, niente grigi, e il disegno si legge anche senza colore. `x`, `y` e `size` posizionano il disegno dentro l'SVG che lo contiene (il tabellone è
  1000 × 1000, una casella 100).
- Tratto `strokeWidth` 5,5, `strokeLinecap="round"`, `strokeLinejoin="round"`; almeno una campitura piena per
  illustrazione. Nessun testo dentro gli SVG.
- Leggibili a 48 px: niente dettagli sotto le 3 unità.
- **Il quadrante in alto a sinistra è occupato dall'alone del numero.** Nella casella il numero si disegna sopra
  l'illustrazione (`x + 18`, `y + 38`, corpo 22, alone 12) e l'alone di carta copre circa il rettangolo
  `x 12…48`, `y 16…44` della casella — che nelle coordinate dell'illustrazione, disegnata a 68 unità dentro le 100
  della casella, è **tutto ciò che sta sopra e a sinistra di (47, 41)**. Non è un angolino: è un quarto del disegno,
  e con un numero a due cifre è il caso peggiore.
  Conseguenze: una campitura piena regge il morso come una tacca, un tratto sottile o un **anello** viene tagliato
  in due (è D-65 applicata a un disegno: `deep-mirror` era una cornice ovale a tratto e si leggeva come una «C»,
  poi come una testa di cavallo); e la parte che **definisce la silhouette** non va lì — lo specchio è finito a
  massa piena, spostato in basso a destra. Le stelle invece non ne soffrono: una tacca su una punta non si vede.
  Un disegno si guarda a 48 px **nella casella**, non solo in `/dev/art`.
- La silhouette conta più del dettaglio: a 48 px «massa in alto + tratti lisci in basso» si legge sempre come un
  corpo (una persona, un tavolo, un animale a quattro zampe). Per uscirne serve un segno che i corpi non hanno —
  per le radici la **biforcazione** (`deep-roots`, tre versioni buttate prima di trovarlo).
- Prodotto (F6-02): **38 disegni**, 35 per le domande (7 per categoria) e 3 stelle. Le decorazioni multi-cella
  non sono file: sono le forme di `decorations` disegnate nel tabellone.
- La pagina `/dev/art` (solo sviluppo, 404 in produzione) li mostra tutti a 48 px e a 200 px: è la misura con cui
  si decide se un disegno si capisce (`npx vitest run src/art` tiene il registro e la disposizione d'accordo).

| Categoria            | Illustrazioni                                                                      |
| -------------------- | ---------------------------------------------------------------------------------- |
| Gusti (`tastes`)     | bottiglia, calici, vinile, chitarra, tazza, cono gelato, pane                      |
| Ricordi (`memories`) | lettera, cornice, macchina da scrivere, telefono, biglietto, musicassetta, valigia |
| Futuro (`future`)    | anello, casa, gabbia aperta, mappa, chiave, aereo di carta, piantina               |
| Profonde (`deep`)    | specchio, rosa, serratura, candela, luna, radici, clessidra                        |
| Buffe (`funny`)      | occhio, spazzolino, dado, mela, calzino, banana, sveglia                           |
| Stelle (`stars`)     | stella, ammasso di stelle, stella grande                                           |

## Animazioni Rive (`public/rive`, `src/art/rive`)

Rive per i personaggi; tutto ciò che dipende dalla disposizione resta in SVG + Motion
([D-14](decisions.md#d-14--rive-per-i-personaggi)).

**Chi fa cosa:** i file `.riv` si disegnano a mano nell'editor Rive e si esportano in `public/rive/`
(nessun server MCP). Gli agenti non creano né modificano i `.riv`: scrivono i wrapper in `src/art/rive/` e i
segnaposto, basandosi sulla tabella qui sotto.

| File          | Artboard            | State machine | Input                                                                  | Segnaposto                          |
| ------------- | ------------------- | ------------- | ---------------------------------------------------------------------- | ----------------------------------- |
| `mascots.riv` | una per forma (6)   | `Mood`        | `mood` (number: 0 neutro, 1 felice, 2 sorpreso, 3 triste, 4 esultante) | SVG statico della forma             |
| `pawns.riv`   | una per animale (6) | `Pawn`        | trigger `hop`, `celebrate`; bool `active`                              | cerchio colorato + numero del posto |
| `dice.riv`    | `Die`               | `Roll`        | trigger `roll`; number `value` 1-6                                     | numero in un quadrato               |
| `card.riv`    | `Card`              | `Flip`        | trigger `flip`                                                         | transizione CSS                     |
| `finale.riv`  | `Finale`            | `Reveal`      | trigger `revealStar`; number `winner` (0 pareggio, 1, 2)               | testo                               |

- I nomi di artboard, state machine e input sono un **contratto**: cambiarli significa aggiornare questa tabella e il wrapper.
- Ogni wrapper React (`src/art/rive/*.tsx`) carica il file con `@rive-app/react-canvas`, espone props tipizzate
  (es. `<Pawn animal="fox" color="red" hop={n} />`) e mostra il segnaposto finché il file non è caricato o se manca.
  I wrapper ci sono: `PawnView`, `DieView`, `CardView`, `MascotView`, `FinaleView` (registro in `src/art/rive/index.ts`).
- **Dove sono collegati** (D-68): la pedina del tabellone, il dado, la carta e la schermata finale. La pedina disegna
  il canvas Rive dentro un `foreignObject`, perché dentro un SVG il canvas è HTML e non entra altrimenti. Il posto
  della **mascotte** è deciso (D-74): pannello di destra della partita, un animale per posto — lo stesso della
  pedina — con il `mood` mosso dagli stessi `GameEvent[]` che guidano le animazioni. **Non è collegata**: finché
  `mascots.riv` manca il segnaposto occuperebbe spazio senza fare niente, cioè contro la regola qui sotto.
- **In partita il segnaposto è il componente attuale della schermata**: ogni wrapper prende `placeholder`, e le
  schermate ci passano quello che si vede oggi — il cerchio SVG della pedina, il dado a **pallini** (`DieFace`), la
  carta con i suoi figli (`placeholder="children"`, perché l'ingresso è già Motion, D-57). I segnaposto disegnati per
  `/dev/art` restano il **campione della pagina**: servono a guardare il wrapper, non a stare in partita.
- Nella **schermata finale** il file è un **ornamento**, in uno spazio nuovo in testa alla sezione, e il segnaposto di
  quello spazio è «niente» (`placeholder="none"`): le tre rivelazioni e le loro frasi restano come sono. Un'animazione
  decorativa non può mangiare informazione di gioco (D-69).
- La presenza del file si controlla **una volta per sessione** con una richiesta `HEAD` su `public/rive/<file>`: senza
  file resta il segnaposto e in console compare la riga di rete del 404 (una per file, non un errore dell'app). Sul
  server la risposta è sempre «non c'è», così il primo disegno è il segnaposto e non si disallinea l'idratazione.
  I segnaposto si guardano tutti insieme in fondo a `/dev/art`.
- Solo bianco e nero dentro i `.riv`; il colore del giocatore lo aggiunge il wrapper (gettone sotto la testa).
- Rispettare `prefers-reduced-motion`: nessuna animazione ciclica, transizioni ridotte.

## Animazioni in codice (Motion)

Pedina che salta casella per casella (percorso = sequenza di centri cella), salita lungo la scala, discesa lungo il
serpente (seguendo la stessa curva dell'SVG), carte che entrano nel pannello. Durate brevi (150-400 ms per passo).
Le **pedine dei minigiochi** (tris, forza 4, memory) seguono la stessa regola: una mossa per volta, in coda
(`src/features/minigames/use-minigame-queue.ts`), e ogni pedina o carta entrata adesso entra con Motion — in memory
la coppia sbagliata resta scoperta il tempo di vederla prima di richiudersi (D-62). Con `prefers-reduced-motion`
nessuna di queste animazioni parte.

## Suoni

Opzionali, disattivati di default, interruttore nel pannello laterale.
