# art/

- `illustrations/`: componenti SVG React, uno per illustrazione (`IllustrationId` = nome file in kebab-case).
  Regole di disegno: docs/design.md § Illustrazioni SVG.
- `rive/`: wrapper React per i file `.riv` in `public/rive/`, ognuno con un segnaposto SVG/CSS se il file manca o Rive non si carica.
  Regole: docs/design.md § Animazioni Rive.
  I file attesi — li disegna a mano il proprietario nell'editor Rive, gli agenti non li creano — sono
  `pawns.riv` (una artboard per animale), `dice.riv` (`Die`/`Roll`), `card.riv` (`Card`/`Flip`),
  `mascots.riv` (una artboard per forma, `Mood`), `finale.riv` (`Finale`/`Reveal`).
  Wrapper: `PawnView`, `DieView`, `CardView`, `MascotView`, `FinaleView` (registro in `index.ts`, nomi dei file in `files.ts`).
  La presenza del file si controlla **una volta per sessione** con una richiesta `HEAD`: senza file resta il
  segnaposto e in console compare una riga di rete (404 dell'asset), non un errore dell'app.
