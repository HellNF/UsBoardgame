/**
 * La faccia dei personaggi: due occhi grandi, e quasi nient'altro.
 *
 * È l'unica cosa che i personaggi hanno dentro la sagoma, e viene dalle reference del
 * proprietario (`docs/reference/mascots/`): là un animale è **una macchia piena** con due occhi
 * bianchi grandi e tondi dentro, attaccati in mezzo alla faccia, con una pupilla piccola. Non
 * c'è naso, quasi mai c'è bocca, e il muso non esiste.
 *
 * L'umore sta **negli occhi**, non nella bocca, e anche quello viene dalla reference: la
 * palpebra che scende è d'inchiostro come la sagoma, quindi non si aggiunge un segno, se ne
 * **toglie** uno. È la differenza fra disegnare una faccia e disegnare una macchia con due
 * buchi.
 *
 * I sei personaggi sono **tutti d'inchiostro**, e si distinguono solo per la sagoma: provata
 * anche la strada mista (due chiari con il contorno, come nella prima reference) e su un
 * tabellone di carta i due chiari erano i più deboli — e per combinazione erano proprio i due
 * animali con cui la lobby fa partire una serata.
 */
import type { CharacterMood } from "./types";

export type FaceSpec = {
  /** I centri dei due occhi: nella reference sono grandi e si toccano quasi. */
  eyes: readonly [{ x: number; y: number }, { x: number; y: number }];
  /** Raggi dell'occhio. */
  rx: number;
  ry: number;
  /** Dove nasce la bocca, quando l'umore ne vuole una. */
  mouth?: { x: number; y: number; w: number };
};

const INK = "var(--color-ink)";
const PAPER = "var(--color-paper)";

/**
 * Quanto è grande la pupilla rispetto all'occhio.
 *
 * 0,3 e non 0,42: al 42% l'occhio esce a **ciambella** — un anello bianco con un buco — mentre
 * nella reference è un occhio bianco grande con un punto dentro.
 */
const PUPIL = 0.3;

/**
 * La palpebra della tristezza: **del colore della sagoma**, quindi non aggiunge un segno alla
 * faccia, ne toglie un pezzo all'occhio.
 *
 * È inclinata, e l'inclinazione è tutta la differenza fra triste e assonnato: scende verso
 * **l'esterno** e resta alta dalla parte del naso. Simmetrica — com'era nella prima versione —
 * l'animale sembrava solo mezzo addormentato.
 */
function Lid({ x, y, rx, ry }: { x: number; y: number; rx: number; ry: number }) {
  const outer = y - ry * 0.05;
  const inner = y - ry * 0.48;
  const left = x < 50 ? outer : inner;
  const right = x < 50 ? inner : outer;
  return (
    <path
      d={`M${x - rx - 1} ${left}Q${x} ${y - ry * 1.9} ${x + rx + 1} ${right}Z`}
      fill={INK}
      stroke="none"
    />
  );
}

function Eye({
  mood,
  x,
  y,
  rx,
  ry,
}: {
  mood: CharacterMood;
  x: number;
  y: number;
  rx: number;
  ry: number;
}) {
  if (mood === "esultante")
    // L'occhio chiuso che ride: un arco bianco, come il gatto che dorme nella reference. Non è
    // un occhio con qualcosa sopra, è un altro segno.
    return (
      <path
        d={`M${x - rx} ${y + ry * 0.35}Q${x} ${y - ry * 0.95} ${x + rx} ${y + ry * 0.35}`}
        fill="none"
        stroke={PAPER}
        strokeWidth={rx * 0.5}
        strokeLinecap="round"
      />
    );

  const pupil = mood === "sorpreso" ? rx * PUPIL * 0.62 : rx * PUPIL;
  const drop = mood === "triste" ? ry * 0.34 : 0;
  // Felice schiaccia l'occhio: è la strizzata di chi sorride. Serve anche per una ragione
  // meccanica, trovata da una prova e non a occhio — la civetta non ha bocca, e senza questo la
  // sua faccia felice usciva **identica** a quella neutra.
  const height = mood === "felice" ? ry * 0.76 : ry;

  return (
    <>
      <ellipse cx={x} cy={y} rx={rx} ry={height} fill={PAPER} stroke={INK} strokeWidth={2.2} />
      <ellipse cx={x} cy={y + drop} rx={pupil} ry={pupil * 1.06} fill={INK} stroke="none" />
      {mood === "triste" && <Lid x={x} y={y} rx={rx} ry={height} />}
    </>
  );
}

/** La bocca: piccolissima, e solo dove serve. Nella reference quasi nessuno ce l'ha. */
function Mouth({ mood, x, y, w }: { mood: CharacterMood; x: number; y: number; w: number }) {
  if (mood === "felice")
    return (
      <path
        d={`M${x - w / 2} ${y}Q${x} ${y + w * 0.55} ${x + w / 2} ${y}`}
        fill="none"
        stroke={PAPER}
        strokeWidth={w * 0.22}
        strokeLinecap="round"
      />
    );
  if (mood === "esultante")
    return (
      <path
        d={`M${x - w * 0.6} ${y - w * 0.1}Q${x} ${y + w * 0.85} ${x + w * 0.6} ${y - w * 0.1}Z`}
        fill={PAPER}
        stroke="none"
      />
    );
  if (mood === "sorpreso")
    return <circle cx={x} cy={y + w * 0.15} r={w * 0.18} fill={PAPER} stroke="none" />;
  return null;
}

export function Face({ spec, mood = "neutro" }: { spec: FaceSpec; mood?: CharacterMood }) {
  const { eyes, rx, ry, mouth } = spec;
  return (
    <g data-parte="faccia">
      {eyes.map((eye) => (
        <Eye key={eye.x} mood={mood} x={eye.x} y={eye.y} rx={rx} ry={ry} />
      ))}
      {mouth ? <Mouth mood={mood} x={mouth.x} y={mouth.y} w={mouth.w} /> : null}
    </g>
  );
}
