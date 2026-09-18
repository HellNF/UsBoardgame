/**
 * La faccia dei personaggi: occhi e bocca, per umore.
 *
 * Sei animali per cinque umori sono trenta facce, e disegnarle una per una vuol dire che al
 * terzo cambio non si somigliano più. Qui l'animale dice **dove** stanno gli occhi e la bocca
 * (`FaceSpec`, nel suo file) e l'umore dice **come** sono fatti: così cambiare il sorriso lo
 * cambia a tutti e sei, e un occhio resta un occhio anche sulla testa larga della rana.
 *
 * Due tipi di occhio, perché due animali hanno l'occhio come segno principale: `punto` è il
 * puntino d'inchiostro (volpe, coniglio, orso), `disco` è il disco chiaro con la pupilla
 * (gatto, rana, civetta) — e a 34 px, che è quanto misura una pedina sul tabellone, il disco è
 * l'unica cosa che si veda ancora.
 */
import type { CharacterMood } from "./types";

export type FaceSpec = {
  /** I centri dei due occhi. */
  eyes: readonly [{ x: number; y: number }, { x: number; y: number }];
  /** Raggio: del puntino, oppure del disco chiaro. */
  eyeR: number;
  eyeStyle?: "punto" | "disco";
  /** Il riempimento del disco (`var(--color-art-…)`); serve solo con `disco`. */
  discFill?: string;
  /** Il centro della bocca. Senza, l'animale non ne ha una: la civetta ha il becco. */
  mouth?: { x: number; y: number };
  mouthWidth?: number;
};

const INK = "var(--color-ink)";

/** La bocca: un segno solo, diverso per umore. */
function Mouth({ mood, x, y, w }: { mood: CharacterMood; x: number; y: number; w: number }) {
  const half = w / 2;
  switch (mood) {
    case "felice":
      return <path d={`M${x - half} ${y - w * 0.12}Q${x} ${y + w * 0.5} ${x + half} ${y - w * 0.12}`} />;
    case "triste":
      return <path d={`M${x - half} ${y + w * 0.28}Q${x} ${y - w * 0.32} ${x + half} ${y + w * 0.28}`} />;
    case "sorpreso":
      // Il tondo non cresce con la bocca: sulla rana, che l'ha larga 30, un raggio proporzionale
      // diventava un buco in mezzo alla faccia.
      return <circle cx={x} cy={y + w * 0.1} r={Math.min(w * 0.22, 3.6)} fill={INK} stroke="none" />;
    case "esultante":
      // Bocca aperta: l'unica piena, perché l'esultanza si vede da lontano o non si vede.
      return (
        <path
          d={`M${x - half} ${y - w * 0.1}Q${x} ${y + w * 0.75} ${x + half} ${y - w * 0.1}Z`}
          fill={INK}
        />
      );
    default:
      return <path d={`M${x - half * 0.7} ${y}h${half * 1.4}`} />;
  }
}

/**
 * Il sopracciglio della tristezza: **alto dalla parte del naso**, basso verso l'esterno.
 *
 * Il verso non è un dettaglio, è l'unica cosa che distingue triste da arrabbiato: renderizzando
 * la prima versione tutti e sei sembravano furiosi, perché l'avevo disegnato al contrario
 * (alto fuori, basso dentro, che è il cipiglio). Gira col segno di `x - 50`, così i due occhi
 * sono uno lo specchio dell'altro.
 */
function Brow({ x, y, r }: { x: number; y: number; r: number }) {
  // Le due altezze in unità di raggio, prese dai due capi del sopracciglio: quello verso il
  // naso sta a 2.8, quello verso l'orecchio a 1.6. Quale dei due sia il capo sinistro dipende
  // da che occhio è.
  const left = x < 50 ? 1.6 : 2.8;
  const right = x < 50 ? 2.8 : 1.6;
  return (
    <path
      d={`M${x - r * 1.8} ${y - r * left}Q${x} ${y - r * 2.4} ${x + r * 1.8} ${y - r * right}`}
      strokeWidth={3.5}
    />
  );
}

/** Un occhio a puntino, con la palpebra dei due umori che ne hanno bisogno. */
function DotEye({ mood, x, y, r }: { mood: CharacterMood; x: number; y: number; r: number }) {
  if (mood === "esultante")
    // Gli occhi chiusi all'insù: il puntino non sa esultare.
    return <path d={`M${x - r * 1.5} ${y + r * 0.5}Q${x} ${y - r * 1.4} ${x + r * 1.5} ${y + r * 0.5}`} />;

  const radius = mood === "sorpreso" ? r * 1.45 : r;
  return (
    <>
      <circle cx={x} cy={y} r={radius} fill={INK} stroke="none" />
      {mood === "triste" && <Brow x={x} y={y} r={r} />}
    </>
  );
}

/** Un occhio a disco: il disco è sempre lo stesso, la pupilla dice l'umore. */
function DiscEye({
  mood,
  x,
  y,
  r,
  fill,
}: {
  mood: CharacterMood;
  x: number;
  y: number;
  r: number;
  fill: string;
}) {
  const pupil = mood === "sorpreso" ? r * 0.3 : r * 0.44;
  const lift = mood === "triste" ? r * 0.3 : 0;
  return (
    <>
      <circle cx={x} cy={y} r={r} fill={fill} strokeWidth={4.5} />
      {mood === "esultante" ? (
        // L'occhio chiuso all'insù **dentro** il disco: senza, la civetta — che non ha bocca —
        // esultava identica a come stava neutra, perché l'unico segno era la pupilla.
        <path
          d={`M${x - r * 0.62} ${y + r * 0.28}Q${x} ${y - r * 0.58} ${x + r * 0.62} ${y + r * 0.28}`}
          strokeWidth={r * 0.34}
        />
      ) : (
        <circle cx={x} cy={y + lift} r={pupil} fill={INK} stroke="none" />
      )}
      {/* Felice: la palpebra di sotto che sale, cioè l'occhio che ride. */}
      {mood === "felice" && (
        <path
          d={`M${x - r * 0.9} ${y + r * 0.42}Q${x} ${y + r * 1.15} ${x + r * 0.9} ${y + r * 0.42}`}
          strokeWidth={r * 0.28}
        />
      )}
      {mood === "triste" && <Brow x={x} y={y} r={r * 0.62} />}
    </>
  );
}

export function Face({ spec, mood = "neutro" }: { spec: FaceSpec; mood?: CharacterMood }) {
  const { eyes, eyeR, eyeStyle = "punto", discFill = "var(--color-art-cream)", mouth } = spec;
  return (
    <g data-parte="faccia">
      {eyes.map((eye) =>
        eyeStyle === "disco" ? (
          <DiscEye key={eye.x} mood={mood} x={eye.x} y={eye.y} r={eyeR} fill={discFill} />
        ) : (
          <DotEye key={eye.x} mood={mood} x={eye.x} y={eye.y} r={eyeR} />
        ),
      )}
      {mouth ? <Mouth mood={mood} x={mouth.x} y={mouth.y} w={spec.mouthWidth ?? 14} /> : null}
    </g>
  );
}
