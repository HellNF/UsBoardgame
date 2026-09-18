/**
 * Rana — personaggio `frog`.
 *
 * Gli occhi stanno **sopra** la testa, su due bozzi, e la bocca è larga quanto la faccia: sono
 * le due misure che rendono una rana una rana. La testa è un'ellisse schiacciata, così la
 * sagoma è larga e bassa dove le altre cinque sono alte e tonde.
 */
import { Face, type FaceSpec } from "./face";
import { CharacterFrame } from "./frame";
import type { CharacterProps } from "./types";

const SKIN = "var(--color-art-green)";
const BELLY = "var(--color-art-cream)";

const FACE: FaceSpec = {
  eyes: [
    { x: 33, y: 26 },
    { x: 67, y: 26 },
  ],
  eyeR: 8,
  eyeStyle: "disco",
  mouth: { x: 50, y: 55 },
  mouthWidth: 30,
};

export function Frog(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <g data-parte="corpo">
        <path d="M27 86C25 70 36 58 50 58C64 58 75 70 73 86Z" fill={SKIN} />
        <path d="M40 86C38 76 43 69 50 69C57 69 62 76 60 86Z" fill={BELLY} />
      </g>
      <g data-parte="zampe">
        <path d="M28 86C22 86 19 82 21 78M72 86C78 86 81 82 79 78" />
      </g>
      <g data-parte="bozzi">
        <circle cx="33" cy="26" r="12" fill={SKIN} />
        <circle cx="67" cy="26" r="12" fill={SKIN} />
      </g>
      <g data-parte="testa">
        <ellipse cx="50" cy="45" rx="29" ry="21" fill={SKIN} />
      </g>
      <Face spec={FACE} mood={props.mood} />
    </CharacterFrame>
  );
}
