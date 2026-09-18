/**
 * Civetta — personaggio `owl`.
 *
 * I ciuffi sono bassi e aperti verso fuori, e non due punte in cima: alti e verticali
 * facevano la stessa sagoma delle orecchie del gatto, che è l'unico altro animale a punte.
 *
 * I due dischi chiari della faccia sono grandi e **si toccano** al centro: è quello che si
 * vede di una civetta anche a 34 px, e nessuno degli altri cinque ha due macchie chiare così
 * in alto. Non ha bocca: al suo posto c'è il becco, e l'umore lo dicono le pupille e il
 * sopracciglio della faccia condivisa.
 */
import { Face, type FaceSpec } from "./face";
import { CharacterFrame } from "./frame";
import type { CharacterProps } from "./types";

const FEATHERS = "var(--color-art-blue)";
const CREAM = "var(--color-art-cream)";

const FACE: FaceSpec = {
  eyes: [
    { x: 39, y: 36 },
    { x: 61, y: 36 },
  ],
  eyeR: 10.5,
  eyeStyle: "disco",
  discFill: CREAM,
};

export function Owl(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <g data-parte="corpo">
        <path d="M32 86C30 70 37 57 50 57C63 57 70 70 68 86Z" fill={FEATHERS} />
        <path d="M43 86C41 76 44 68 50 68C56 68 59 76 57 86Z" fill={CREAM} />
      </g>
      <g data-parte="ali">
        <path d="M34 64C29 72 30 81 34 86M66 64C71 72 70 81 66 86" />
      </g>
      <g data-parte="ciuffi">
        <path d="M29 27 21 12 41 19Z" fill={FEATHERS} />
        <path d="M71 27 79 12 59 19Z" fill={FEATHERS} />
      </g>
      <g data-parte="testa">
        <circle cx="50" cy="38" r="23" fill={FEATHERS} />
      </g>
      <Face spec={FACE} mood={props.mood} />
      <g data-parte="becco">
        <path d="M50 55 45 45h10z" fill="var(--color-art-amber)" strokeWidth={3.5} />
      </g>
    </CharacterFrame>
  );
}
