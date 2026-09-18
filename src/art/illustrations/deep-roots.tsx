/**
 * Radici — illustrazione di categoria «profonde» (id `deep-roots`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 *
 * Un pezzo di terra visto in sezione: la terra è una **campitura piena** in alto (non un
 * tratteggio: a 48 px un tratteggio da 2,5 unità sparisce, e il minimo di docs/design.md è
 * 3 unità) e le radici scendono da lì, **spesse dove nascono e sottili in punta**, con
 * direzioni aperte a ventaglio e lunghezze tutte diverse.
 *
 * Niente tronco sopra la terra: il blocchetto in alto con due tratti simmetrici sotto dava la
 * silhouette di una persona con le gambe aperte, ed era quello che si vedeva a 48 px (H1).
 * Così pure le due trappole trovate rifacendolo: radici parallele e di lunghezza simile si
 * leggono come le zampe di una cosa sola, e radici che si toccano alla base diventano una
 * frangia sola. Servono lo spazio di carta fra le basi e l'asimmetria.
 *
 * La radice si assottiglia per **gradini** (da 11 a 3,5 unità) e non come un cuneo appuntito:
 * il cuneo, sotto una campitura piena, si legge come un dente o un artiglio. La punta resta
 * tonda, come la coda dei serpenti del tabellone.
 */
import type { IllustrationProps } from "./types";

type Point = { x: number; y: number };

/** Un decimale, come le altre illustrazioni: i percorsi restano leggibili nel diff. */
const round = (value: number): number => Math.round(value * 10) / 10;
const at = (point: Point): string => `${round(point.x)} ${round(point.y)}`;

/**
 * Spessori di una radice, dalla base alla punta: otto gradini da 11 a 3,5 unità (nessuno sotto
 * le 3, a 48 px sparirebbe). Tanti e piccoli perché pochi gradini grossi si vedono come
 * ginocchia meccaniche a 200 px: con le punte tonde i gradini non si distinguono.
 */
const WIDTHS = Array.from({ length: 8 }, (_, index) => 11 - (11 - 3.5) * (index / 7));

/**
 * Una radice: una curva smorzata dalla base alla punta, disegnata a gradini di spessore.
 * `bend` piega la radice di lato, così non sono tutte dritte.
 */
function rootSegments(base: Point, tip: Point, bend: number): { d: string; width: number }[] {
  const delta = { x: tip.x - base.x, y: tip.y - base.y };
  const length = Math.hypot(delta.x, delta.y) || 1;
  // Normale all'asse: è la direzione in cui la radice si piega.
  const normal = { x: -delta.y / length, y: delta.x / length };
  const control = {
    x: base.x + delta.x * 0.55 + normal.x * bend,
    y: base.y + delta.y * 0.55 + normal.y * bend,
  };

  // La quadratica base → controllo → punta, campionata in `WIDTHS.length` tratti.
  const pointAt = (t: number): Point => {
    const u = 1 - t;
    return {
      x: u * u * base.x + 2 * u * t * control.x + t * t * tip.x,
      y: u * u * base.y + 2 * u * t * control.y + t * t * tip.y,
    };
  };

  return WIDTHS.map((width, index) => {
    const from = pointAt(index / WIDTHS.length);
    const to = pointAt((index + 1) / WIDTHS.length);
    return { d: `M ${at(from)} L ${at(to)}`, width };
  });
}

/**
 * Le radici: basi, punte e pieghe scelte a mano, tutte diverse. Fra una base e l'altra restano
 * almeno 10 unità di carta, altrimenti le radici si fondono in una frangia sola.
 */
const ROOTS: { base: Point; tip: Point; bend: number }[] = [
  // Esce di lato verso sinistra e finisce alta: è la più corta.
  { base: { x: 26, y: 26 }, tip: { x: 14, y: 54 }, bend: 5 },
  // La più lunga: scende a sinistra e si porta il peso del disegno.
  { base: { x: 42, y: 28 }, tip: { x: 31, y: 87 }, bend: -5 },
  // Seconda per lunghezza, verso destra.
  { base: { x: 60, y: 28 }, tip: { x: 70, y: 76 }, bend: -4 },
  // Verso destra, corta: nessuna coppia con quella di sinistra.
  { base: { x: 77, y: 25 }, tip: { x: 88, y: 47 }, bend: -4 },
];

export function DeepRoots({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={5.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {/* Le radici: prima loro, così la terra le copre dove entrano. */}
      {ROOTS.map((root, index) =>
        rootSegments(root.base, root.tip, root.bend).map((segment, step) => (
          <path key={`${index}-${step}`} d={segment.d} strokeWidth={segment.width} />
        )),
      )}
      {/* La terra: campitura piena, con il bordo di sotto irregolare come una sezione. */}
      <path
        d="M12 12h76v10c-6 5-14 2-20 5-8 4-16 1-22 4-8 2-14 0-20 2-6 2-10 0-14-3z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
