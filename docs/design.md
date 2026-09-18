# Estetica e asset

Sintesi operativa di [specs.md § Estetica](specs.md#estetica). Reference visive in [reference/](reference/).

## Principi

1. **Bianco e nero puro.** Carta `#F2F2F0`, inchiostro `#1A1A1A`. Nessun grigio, nessuna ombra, nessun gradiente.
2. **Il colore è solo dei giocatori:** gettone della pedina, evidenziazione del turno e punteggi. Mai sul tabellone.
3. **Geometria, non decorazione:** il tipo di casella si riconosce dalla forma (vedi tabella).
4. **Tratto spesso e campiture nere** per le illustrazioni, come le stampe della reference.
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
- Livelli, dal basso: celle → geometrie multi-cella (`decorations`) → illustrazioni → scale → serpenti →
  cornice → **numeri e simboli delle caselle** → pedine.
- **Numeri e simboli sopra scale e serpenti:** il numero della casella, il simbolo della stella, i cerchi delle
  monete e l'iniziale della categoria si disegnano nell'ultimo strato, ognuno con un **alone del colore della
  casella** (carta, o inchiostro sulle caselle sfida) frapposto fra il segno e ciò che c'è sotto. Dove una scala o
  un serpente passano su una casella, numero e simbolo restano leggibili: senza l'alone finiscono sotto la linea.

| Tipo di casella | Resa                                                                      |
| --------------- | ------------------------------------------------------------------------- |
| Domanda         | bianca + illustrazione della categoria                                    |
| Sfida           | nera piena, numero in bianco                                              |
| Imprevisto      | metà nera in diagonale                                                    |
| Monete          | cerchio nero pieno (+3) o vuoto (−2), anche come semicerchio su più celle |
| Stella          | illustrazione di stella                                                   |
| Libera          | bianca vuota                                                              |

- **Scale:** due montanti neri spessi, pioli bianchi bordati di nero, generate dagli estremi `from`/`to`.
- **Serpenti:** curva di Bézier sinuosa generata dagli estremi, corpo nero o bianco a macchie, testa con occhio.
  La generazione deve essere deterministica per disposizione (stesso tabellone = stessa forma).
- **Segnaposto (fino alla fase 6):** celle geometriche vere; illustrazioni = iniziale della categoria in corsivo.

## Illustrazioni SVG (`src/art/illustrations`)

- Un componente per file: `rose-bell.tsx` esporta `RoseBell`; registro `index.ts` con `IllustrationId → componente`.
- `viewBox="0 0 100 100"`, margine interno di 12 unità, `fill` e `stroke` solo `currentColor` o `var(--color-paper)`.
- Tratto `strokeWidth` 5-6, `strokeLinecap="round"`, `strokeLinejoin="round"`; almeno una campitura nera piena per
  illustrazione. Nessun testo dentro gli SVG.
- Leggibili a 48 px: niente dettagli sotto le 3 unità.
- Elenco da produrre (~45): 35 per le domande (almeno 3-4 per categoria, vedi tabella delle categorie in specs),
  3 stelle, decorazioni.

| Categoria            | Illustrazioni                                    |
| -------------------- | ------------------------------------------------ |
| Gusti (`tastes`)     | bottiglia, calici, vinile, chitarra              |
| Ricordi (`memories`) | lettera, cornice, macchina da scrivere, telefono |
| Futuro (`future`)    | anello, casa, gabbia aperta, mappa               |
| Profonde (`deep`)    | specchio, rosa nella campana, serratura          |
| Buffe (`funny`)      | occhio, spazzolino, dado, mela                   |

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
| `finale.riv`  | `Finale`            | `Reveal`      | trigger `revealStar`, `winner`                                         | testo                               |

- I nomi di artboard, state machine e input sono un **contratto**: cambiarli significa aggiornare questa tabella e il wrapper.
- Ogni wrapper React (`src/art/rive/*.tsx`) carica il file con `@rive-app/react-canvas`, espone props tipizzate
  (es. `<Pawn animal="fox" color="red" hop={n} />`) e mostra il segnaposto finché il file non è caricato o se manca.
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
