/**
 * Orso — personaggio `bear`.
 *
 * Tutto tondo: orecchie rotonde, testa grande, muso largo. È la sagoma opposta a quella della
 * volpe e del gatto, che sono tutti angoli, e serve che sia così — con sei animali la prima
 * cosa che li separa è che due non abbiano la stessa silhouette.
 */
import { Face, type FaceSpec } from "./face";
import { CharacterFrame } from "./frame";
import type { CharacterProps } from "./types";

const FUR = "var(--color-art-brown)";
const MUZZLE = "var(--color-art-sand)";

const FACE: FaceSpec = {
  eyes: [
    { x: 40, y: 36 },
    { x: 60, y: 36 },
  ],
  eyeR: 3.4,
  mouth: { x: 50, y: 57 },
  mouthWidth: 12,
};

export function Bear(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <g data-parte="corpo">
        <path d="M31 86C29 70 37 57 50 57C63 57 71 70 69 86Z" fill={FUR} />
        <path d="M42 86C40 75 43 67 50 67C57 67 60 75 58 86Z" fill={MUZZLE} />
      </g>
      <g data-parte="orecchie">
        <circle cx="29" cy="22" r="10" fill={FUR} />
        <circle cx="71" cy="22" r="10" fill={FUR} />
        <circle cx="29" cy="22" r="4.5" fill={MUZZLE} strokeWidth={3} />
        <circle cx="71" cy="22" r="4.5" fill={MUZZLE} strokeWidth={3} />
      </g>
      <g data-parte="testa">
        <circle cx="50" cy="42" r="23" fill={FUR} />
        <ellipse cx="50" cy="52" rx="14" ry="10.5" fill={MUZZLE} stroke="none" />
        <ellipse cx="50" cy="48" rx="4.2" ry="3.1" fill="var(--color-ink)" stroke="none" />
      </g>
      <Face spec={FACE} mood={props.mood} />
    </CharacterFrame>
  );
}
