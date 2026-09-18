/**
 * Coniglio — personaggio `rabbit`.
 *
 * Le orecchie sono lunghe **e inclinate di lato**: due ellissi verticali identiche fanno una
 * sagoma simmetrica che a 34 px legge come una forcella, non come un animale. Inclinandole di
 * otto gradi verso fuori la sagoma diventa riconoscibile anche piccola.
 */
import { Face, type FaceSpec } from "./face";
import { CharacterFrame } from "./frame";
import type { CharacterProps } from "./types";

const FUR = "var(--color-art-sand)";
const CREAM = "var(--color-art-cream)";

const FACE: FaceSpec = {
  eyes: [
    { x: 41, y: 36 },
    { x: 59, y: 36 },
  ],
  eyeR: 3.3,
  mouth: { x: 50, y: 56 },
  mouthWidth: 11,
};

export function Rabbit(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <g data-parte="corpo">
        <path d="M33 86C31 70 38 57 50 57C62 57 69 70 67 86Z" fill={FUR} />
        <path d="M42 86C40 75 43 67 50 67C57 67 60 75 58 86Z" fill={CREAM} />
      </g>
      <g data-parte="orecchie">
        <g transform="rotate(-9 40 20)">
          <ellipse cx="40" cy="17" rx="7.5" ry="17" fill={FUR} />
          <ellipse cx="40" cy="16" rx="3.4" ry="11" fill={CREAM} strokeWidth={3} />
        </g>
        <g transform="rotate(9 60 20)">
          <ellipse cx="60" cy="17" rx="7.5" ry="17" fill={FUR} />
          <ellipse cx="60" cy="16" rx="3.4" ry="11" fill={CREAM} strokeWidth={3} />
        </g>
      </g>
      <g data-parte="testa">
        <circle cx="50" cy="40" r="21" fill={FUR} />
        <path d="M50 44C57 44 61 48 61 52C61 57 56 60 50 60C44 60 39 57 39 52C39 48 43 44 50 44Z" fill={CREAM} stroke="none" />
      </g>
      <Face spec={FACE} mood={props.mood} />
    </CharacterFrame>
  );
}
