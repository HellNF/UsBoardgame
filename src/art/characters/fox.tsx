/**
 * Volpe — personaggio `fox`.
 *
 * Il segno è la **coda**, e per questo sporge a destra fuori dal corpo: a 34 px le orecchie
 * a punta da sole la fanno confondere col gatto, la coda no. La punta bianca è un cerchio e
 * non un disegno, perché a quella misura un cerchio chiaro in fondo alla coda è già «volpe».
 */
import { Face, type FaceSpec } from "./face";
import { CharacterFrame } from "./frame";
import type { CharacterProps } from "./types";

const FUR = "var(--color-art-terracotta)";
const CREAM = "var(--color-art-cream)";

const FACE: FaceSpec = {
  eyes: [
    { x: 41, y: 34 },
    { x: 59, y: 34 },
  ],
  eyeR: 3.4,
  mouth: { x: 50, y: 51 },
  mouthWidth: 13,
};

export function Fox(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <g data-parte="coda">
        <path d="M67 84C86 81 95 62 84 53C77 47 68 52 69 62C70 70 67 78 60 80Z" fill={FUR} />
        <circle cx="87" cy="58" r="7.5" fill={CREAM} stroke="none" />
      </g>
      <g data-parte="corpo">
        <path d="M33 86C31 70 38 57 50 57C62 57 69 70 67 86Z" fill={FUR} />
        <path d="M42 86C40 75 43 67 50 67C57 67 60 75 58 86Z" fill={CREAM} />
      </g>
      <g data-parte="orecchie">
        <path d="M31 25 27 5 47 17Z" fill={FUR} />
        <path d="M69 25 73 5 53 17Z" fill={FUR} />
        <path d="M33 22 31 11 41 17Z" fill={CREAM} strokeWidth={3} />
        <path d="M67 22 69 11 59 17Z" fill={CREAM} strokeWidth={3} />
      </g>
      <g data-parte="testa">
        <circle cx="50" cy="38" r="22" fill={FUR} />
        <path d="M50 42C58 42 62 47 62 51C62 57 56 60 50 60C44 60 38 57 38 51C38 47 42 42 50 42Z" fill={CREAM} stroke="none" />
      </g>
      <Face spec={FACE} mood={props.mood} />
    </CharacterFrame>
  );
}
