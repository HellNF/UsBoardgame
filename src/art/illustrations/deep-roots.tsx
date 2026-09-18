/**
 * Radici — illustrazione di categoria «profonde» (id `deep-roots`).
 * Regole di disegno: docs/design.md § Illustrazioni SVG.
 *
 * Il segno che dice «radice» è la **biforcazione**: tre radici principali che si aprono in
 * forcelle, sotto una zolla di terra sottile. È la terza versione, e le due precedenti sono la
 * ragione per cui questa è fatta così — a 48 px il disegno non viene letto per i dettagli ma
 * per la silhouette, e «massa in alto + tratti lisci in basso» è sempre un corpo:
 *
 * - tronco con due tratti simmetrici sotto → una persona con le gambe aperte;
 * - campitura piena rettangolare con quattro tratti lisci sotto → un tavolo (H1);
 * - campitura piena tonda con gli stessi tratti → un animale a quattro zampe.
 *
 * Nessuna gamba si biforca, quindi bastano le forcelle a rovesciare la lettura. Da lì tutto il
 * resto: la terra è una **striscia sottile** con gli estremi assottigliati e i bordi irregolari
 * (una zolla, non un asse), e le radici sono tre, di lunghezze diverse e mai parallele.
 *
 * Restano le due regole trovate rifacendolo (H1): fra le basi ci vuole carta, altrimenti le
 * radici diventano una frangia sola; e la radice si assottiglia per **gradini** con la punta
 * tonda, non come un cuneo appuntito, che sotto una campitura piena si legge come un dente.
 * Nessun tratto scende sotto le 3 unità (docs/design.md).
 */
import type { IllustrationProps } from "./types";

type Point = { x: number; y: number };

/** Un decimale, come le altre illustrazioni: i percorsi restano leggibili nel diff. */
const round = (value: number): number => Math.round(value * 10) / 10;
const at = (point: Point): string => `${round(point.x)} ${round(point.y)}`;

/** Spessore di una radice: dalla base alla punta. */
type Taper = { from: number; to: number };

/**
 * La curva di una radice: una quadratica dalla base alla punta, con il punto di controllo
 * spostato di lato da `bend` — è quello che la piega e le toglie l'aria del tratto dritto.
 * Ritorna il punto a una frazione della curva, che serve anche alle forcelle per attaccarsi.
 */
function curve(base: Point, tip: Point, bend: number): (t: number) => Point {
  const delta = { x: tip.x - base.x, y: tip.y - base.y };
  const length = Math.hypot(delta.x, delta.y) || 1;
  // Normale all'asse: la direzione in cui la radice si piega.
  const normal = { x: -delta.y / length, y: delta.x / length };
  const control = {
    x: base.x + delta.x * 0.55 + normal.x * bend,
    y: base.y + delta.y * 0.55 + normal.y * bend,
  };

  return (t: number) => {
    const u = 1 - t;
    return {
      x: u * u * base.x + 2 * u * t * control.x + t * t * tip.x,
      y: u * u * base.y + 2 * u * t * control.y + t * t * tip.y,
    };
  };
}

/**
 * Una radice, disegnata a gradini di spessore lungo la sua curva. I gradini sono tanti e
 * piccoli: pochi e grossi si vedono come ginocchia meccaniche a 200 px, mentre con le punte
 * tonde non si distinguono.
 */
function rootSegments(
  base: Point,
  tip: Point,
  bend: number,
  taper: Taper,
  steps: number,
): { d: string; width: number }[] {
  const pointAt = curve(base, tip, bend);
  return Array.from({ length: steps }, (_, index) => {
    const from = pointAt(index / steps);
    const to = pointAt((index + 1) / steps);
    return {
      d: `M ${at(from)} L ${at(to)}`,
      width: taper.from + (taper.to - taper.from) * (index / (steps - 1)),
    };
  });
}

/** Le tre radici principali: lunghezze diverse, nessuna coppia parallela. */
const MAIN = [
  // La base sta sotto la parte piena della zolla, non sotto la punta che si assottiglia:
  // attaccata all'estremo la radice si staccava dal resto del disegno.
  { id: "sinistra", base: { x: 43, y: 26 }, tip: { x: 29, y: 62 }, bend: 5, taper: { from: 10.5, to: 4 } },
  { id: "centro", base: { x: 54, y: 26 }, tip: { x: 46, y: 88 }, bend: -4, taper: { from: 11, to: 3.5 } },
  { id: "destra", base: { x: 72, y: 25 }, tip: { x: 84, y: 64 }, bend: -5, taper: { from: 10, to: 3.8 } },
] as const;

/** Le forcelle: `t` è il punto della radice madre da cui partono. */
const FORKS = [
  { parent: "sinistra", t: 0.5, tip: { x: 42, y: 54 }, bend: -3, taper: { from: 5, to: 3.2 } },
  { parent: "centro", t: 0.4, tip: { x: 68, y: 60 }, bend: -4, taper: { from: 6, to: 3.2 } },
  { parent: "centro", t: 0.66, tip: { x: 34, y: 80 }, bend: 3, taper: { from: 5, to: 3.2 } },
  { parent: "destra", t: 0.55, tip: { x: 74, y: 84 }, bend: -2, taper: { from: 5.5, to: 3.2 } },
] as const;

/** La zolla: estremi assottigliati e bordi irregolari sopra e sotto. */
const SOIL =
  "M28 22C36 17 46 21 55 18C64 15 73 20 81 18C85 17 87 19 88 21" +
  "C85 27 80 26 74 27C65 30 56 25 47 28C39 31 32 27 28 26Z";

export function DeepRoots({ x = 0, y = 0, size = 100, className }: IllustrationProps) {
  const parentAt = new Map(MAIN.map((root) => [root.id, curve(root.base, root.tip, root.bend)]));

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
      {/* Prima le radici, così la zolla le copre dove entrano nella terra. */}
      {MAIN.map((root) =>
        rootSegments(root.base, root.tip, root.bend, root.taper, 7).map((segment, step) => (
          <path key={`${root.id}-${step}`} d={segment.d} strokeWidth={segment.width} />
        )),
      )}
      {FORKS.map((fork, index) => {
        const base = parentAt.get(fork.parent)?.(fork.t) ?? { x: 50, y: 40 };
        return rootSegments(base, fork.tip, fork.bend, fork.taper, 5).map((segment, step) => (
          <path key={`fork-${index}-${step}`} d={segment.d} strokeWidth={segment.width} />
        ));
      })}
      <path d={SOIL} fill="currentColor" stroke="none" />
    </svg>
  );
}
