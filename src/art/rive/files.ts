/**
 * I file `.riv` che i wrapper di `src/art/rive/` si aspettano in `public/rive/`.
 *
 * I nomi sono un contratto: sono gli stessi della tabella in docs/design.md § Animazioni Rive.
 * Cambiarli qui significa cambiare anche quella tabella. I `.riv` li disegna a mano il
 * proprietario nell'editor Rive: gli agenti non li creano e non li modificano.
 */
export const RIVE_FILES = {
  pawns: "pawns.riv",
  dice: "dice.riv",
  card: "card.riv",
  mascots: "mascots.riv",
  finale: "finale.riv",
} as const;

export type RiveFileName = (typeof RIVE_FILES)[keyof typeof RIVE_FILES];
