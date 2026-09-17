# Reference visive

Immagini che guidano l'estetica ([design.md](../design.md)). Gli agenti che disegnano SVG o animazioni Rive devono
guardarle prima di iniziare.

| Cartella         | Cosa metterci                                                                                          |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `board/`         | Il tabellone "scale e serpenti" in bianco e nero (reference primaria) e altri tabelloni di ispirazione |
| `illustrations/` | Stile delle illustrazioni: oggetti e scene a tratto spesso con campiture nere                          |
| `mascots/`       | Le sei forme con occhi grandi per le mascotte delle reazioni, pedine e animali                         |

**Convenzioni:**

- Nomi file descrittivi, meglio in kebab-case.
- Se un'immagine ha una fonte esterna, annotala qui sotto (per uso privato, ma teniamo traccia).
- Le reference non vengono mai importate dal codice: il sito usa solo asset ridisegnati in `src/art` e `public/rive`.

## Elenco

| File                       | Descrizione                                                                                 | Fonte                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `board/boardReference.png` | **Reference primaria**: tabellone scale e serpenti B/N a tema coppia, 10 × 10               | caricata dal proprietario                                     |
| `mascots/mascots1.png`     | Teste di animali piatte in bianco e nero (coniglio, gatto, orso, …): stile delle **pedine** | illustrazione firmata "DOMZO", solo come riferimento di stile |

## Cosa prendere da `boardReference.png`

Osservazioni per chi fa la disposizione `classic` (F1-01) e l'estetica (fase 6). È una reference di **stile**:
le posizioni di scale e serpenti e il numero di illustrazioni non vanno copiati, valgono le quantità di `rules.md`.

- **Numerazione:** identica alla nostra (1 in basso a sinistra, 100 in alto a sinistra, serpentina). Numeri piccoli
  in un angolo in alto, a sinistra o a destra a seconda di dove lascia spazio l'illustrazione.
- **Cornice e griglia:** cornice nera spessa con angoli arrotondati, bordi delle celle sottili, fondo grigio carta.
- **Celle nere piene** (es. 4, 16, 36, 65): sfide. Alcune hanno un'illustrazione in negativo (bianca su nero).
- **Diagonali metà nere** (es. 2, 6, 79, 96): imprevisti. L'illustrazione può attraversare la diagonale.
- **Cerchi su due celle** (9-10, 62-63, 92-93): cerchio nero diviso a metà dal bordo della cella; è il modello per
  le caselle monete (`decorations` con `shape: "circle"`). Il cerchio può contenere un'illustrazione.
- **Illustrazioni su due celle in verticale** (rosa nella campana 40-41, casa 70-71): trattale come `decorations`
  sopra celle normali.
- **Fasce nere parziali** in fondo alla cella (es. 28, 56): variante grafica, non un tipo di casella.
- **Scale:** montanti neri spessi con estremi arrotondati, pioli bianchi bordati, sempre in diagonale o in verticale,
  lunghe da 2 a 5 file, disegnate sopra le celle.
- **Serpenti:** corpo sinuoso a larghezza costante che si assottiglia verso la coda; due varianti (nero con macchie
  bianche, bianco con contorno e macchie nere); testa piccola con un occhio a mandorla; spesso passano sopra altre
  illustrazioni.
- **Illustrazioni utili per le categorie** (vedi `docs/design.md`): chitarra (21), calici e bottiglia (25, 92-93),
  vinile (90), lettere (50, 84), telefono (58), macchina da scrivere (94), cornice (95), anello (98), gabbia aperta
  (99), rosa nella campana (40-41), serratura (38), specchio (18, 27, 45), mela (15), occhio (2), spazzolino (28),
  clessidra (5).

## Cosa prendere da `mascots1.png`

- Teste piatte e compatte, senza collo, con silhouette riconoscibile anche piccola.
- Due varianti: testa nera con occhi bianchi, oppure testa bianca con contorno nero sottile o assente.
- Occhi grandi e semplici (ovali o punti), bocca a linea: facili da animare in Rive (espressioni, battito di ciglia).
- Per le nostre sei pedine (volpe, coniglio, gatto, orso, rana, gufo): coniglio, gatto e orso hanno un modello
  diretto; volpe, rana e gufo vanno ridisegnati nello stesso stile.
- Sul gioco il fondo è carta `#F2F2F0`, non il grigio caldo dell'immagine.
