/**
 * Wrapper React dei file Rive: `pawns.riv`, `dice.riv`, `card.riv`, `mascots.riv`, `finale.riv`.
 *
 * Ognuno mostra il suo segnaposto geometrico finché il file non c'è in `public/rive/`: i `.riv`
 * li disegna a mano il proprietario nell'editor e gli agenti non li toccano (docs/design.md
 * § Animazioni Rive). Il contratto di artboard, macchine a stati e ingressi è in quella tabella.
 */
export { RIVE_FILES, type RiveFileName } from "./files";
export { RiveCanvas, useRiveFile, type RiveInputs } from "./rive";
export { PawnView, PawnToken, type PawnViewProps } from "./pawn";
export { DieView, DiePlaceholder, type DieViewProps } from "./die";
export { CardView, CardPlaceholder, type CardViewProps } from "./card";
export {
  MascotView,
  MascotPlaceholder,
  type MascotForm,
  type MascotMood,
  type MascotViewProps,
} from "./mascot";
export { FinaleView, FinalePlaceholder, type FinaleViewProps } from "./finale";
