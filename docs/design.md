# Estetica e asset

Sintesi operativa di [specs.md § Estetica](specs.md#estetica). Reference visive in [reference/](reference/).

## Principi

1. **Bianco e nero per il gioco.** Carta `#F2F2F0`, inchiostro `#1A1A1A`. Nessun grigio, nessuna ombra, nessun gradiente.
2. **Il colore dei giocatori è solo dei giocatori:** gettone della pedina, evidenziazione del turno e punteggi. Le
   **illustrazioni** hanno una tavolozza propria, fissa e piatta (D-68): il tabellone è colorato dai disegni, non
   dalle pedine.
3. **Geometria, non decorazione:** il tipo di casella si riconosce dalla forma (vedi tabella).
4. **Tratto spesso e campiture piene** per le illustrazioni, con le tinte della tavolozza (D-68).
5. **Una schermata sola** (≥ 1024 × 768, D-16): la partita non fa scorrere la pagina; il tabellone si adatta
   all'altezza disponibile e, se serve, scorre solo il pannello di destra. Chi ha il turno si riconosce a colpo
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

- **Scale:** due montanti neri spessi, pioli bianchi bordati di nero, generate dagli estremi `from`/`to`.
- **Serpenti:** curva di Bézier sinuosa generata dagli estremi, corpo nero a macchie, coda che si assottiglia,
  testa con un occhio e la lingua. La generazione deve essere deterministica per disposizione (stesso tabellone =
  stessa forma).
- **Decorazioni multi-cella** (`decorations` nella disposizione): forme **piene** in inchiostro, contenute nel
  gruppo di caselle indicato con un margine di 12 unità dai bordi — `disc` (disco), `crescent` (falce),
  `hill` (mezzo disco appoggiato in basso), `diamond` (rombo con un rombo di carta dentro). Stanno sotto scale,
  serpenti e numeri: dove passa una scala o un serpente vincono loro, e il numero della casella resta leggibile
  grazie all'alone (A1). Niente più segnaposto a filo (G1, D-65).
- Le caselle domanda e stella portano **l'illustrazione** del registro (`src/art/illustrations`) dentro un tondo di
  carta, nello strato dei numeri: è l'alone di A1, e il numero della casella si disegna sopra a tutto.

| Tipo di casella | Resa                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| Domanda         | bianca + illustrazione della categoria                                    |
| Sfida           | nera piena, numero in bianco                                              |
| Imprevisto      | metà nera in diagonale                                                    |
| Monete          | cerchio nero pieno (+3) o vuoto (−2), anche come semicerchio su più celle |
| Stella          | illustrazione di stella                                                   |
| Libera          | bianca vuota (può avere una decorazione piena)                            |

## Illustrazioni SVG (`src/art/illustrations`)

- Un componente per file: `tastes-bottle.tsx` esporta `TastesBottle`; registro `index.ts` con
  `IllustrationId → componente` (`Illustration` rende un id con `createElement`, o niente se l'id non c'è).
- `viewBox="0 0 100 100"`, margine interno di 12 unità, `fill` e `stroke` solo `currentColor` o
  `var(--color-paper)`. `x`, `y` e `size` posizionano il disegno dentro l'SVG che lo contiene (il tabellone è
  1000 × 1000, una casella 100).
- Tratto `strokeWidth` 5,5, `strokeLinecap="round"`, `strokeLinejoin="round"`; almeno una campitura piena per
  illustrazione. Nessun testo dentro gli SVG.
- **Tinte piatte dalla tavolozza delle illustrazioni** (D-68): i token `--color-art-*` in `src/app/globals.css`
  (crema, ambra, rosso, blu, cielo, verde, bosco, marrone, terracotta, verde acqua, sabbia, navy). Il contorno resta
  `currentColor` (inchiostro): il disegno si legge anche senza colore. Niente sfumature, nessun grigio.
- Leggibili a 48 px: niente dettagli sotto le 3 unità.
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
