/**
 * Gatto — personaggio `cat`.
 *
 * È l'animale **scuro**: il corpo in blu notte lo distingue da volpe e coniglio prima di
 * qualsiasi dettaglio. Gli occhi sono dischi d'ambra e non puntini d'inchiostro per la stessa
 * ragione: su una testa scura un puntino nero non si vede, e l'occhio del gatto è il suo segno.
 */
import { Face, type FaceSpec } from "./face";
import { CharacterFrame } from "./frame";
import type { CharacterProps } from "./types";

const FUR = "var(--color-art-navy)";
const CREAM = "var(--color-art-cream)";

const FACE: FaceSpec = {
  eyes: [
    { x: 41, y: 36 },
    { x: 59, y: 36 },
  ],
  eyeR: 6.5,
  eyeStyle: "disco",
  discFill: "var(--color-art-amber)",
  mouth: { x: 50, y: 57 },
  mouthWidth: 11,
};

export function Cat(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <g data-parte="coda">
        <path d="M67 83C82 85 91 74 87 62C85 54 77 52 76 59C75 65 80 73 73 77Z" fill={FUR} />
      </g>
      <g data-parte="corpo">
        <path d="M33 86C31 70 38 57 50 57C62 57 69 70 67 86Z" fill={FUR} />
        <path d="M42 86C40 75 43 67 50 67C57 67 60 75 58 86Z" fill={CREAM} />
      </g>
      <g data-parte="orecchie">
        <path d="M32 26 30 6 48 18Z" fill={FUR} />
        <path d="M68 26 70 6 52 18Z" fill={FUR} />
      </g>
      <g data-parte="baffi" strokeWidth={3}>
        <path d="M40 52 27 49M40 56 28 59" />
        <path d="M60 52 73 49M60 56 72 59" />
      </g>
      <g data-parte="testa">
        <circle cx="50" cy="39" r="22" fill={FUR} />
        <path d="M50 48C55 48 58 50.5 58 54C58 57.5 54 60 50 60C46 60 42 57.5 42 54C42 50.5 45 48 50 48Z" fill={CREAM} stroke="none" />
        <path d="M50 55 47.2 51h5.6z" fill="var(--color-ink)" strokeWidth={2.2} />
      </g>
      <Face spec={FACE} mood={props.mood} />
    </CharacterFrame>
  );
}
