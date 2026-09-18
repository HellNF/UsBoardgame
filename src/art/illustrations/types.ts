/**
 * Le illustrazioni del tabellone (F6-02, docs/design.md § Illustrazioni SVG).
 *
 * Ogni illustrazione è un componente con `viewBox="0 0 100 100"`, margine interno di 12 unità,
 * tratto `currentColor` spesso (5-6 unità) e almeno una campitura piena. `x`, `y` e `size`
 * servono a posizionarla **dentro l'SVG che la contiene**, in unità di quel disegno: il
 * tabellone è 1000 × 1000, quindi una casella è 100 unità e il simbolo sta in ~56.
 *
 * Niente testo dentro gli SVG e niente dettagli sotto le 3 unità: a 48 px devono restare
 * leggibili (è quello che mostra `/dev/art`).
 */
export type IllustrationProps = {
  /** Angolo in alto a sinistra, in unità dell'SVG che contiene l'illustrazione. */
  x?: number;
  y?: number;
  /** Lato del riquadro: 100 = tutto il disegno, 48 e 200 sono le misure di `/dev/art`. */
  size?: number;
  className?: string;
};

/** Tratto comune a tutte le illustrazioni (docs/design.md § Illustrazioni SVG). */
export const ILLUSTRATION_STROKE = 5.5;
