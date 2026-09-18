/**
 * Civetta — personaggio `owl`.
 *
 * Gli occhi sono i più grandi dei sei e **si toccano** in mezzo alla faccia: è quello che nella
 * reference fa una civetta. Il becco è un triangolo di carta fra i due, l'unico altro segno —
 * una bocca su una faccia fatta di occhi non ci sta.
 *
 * Le curve sono **sbilenche di proposito**: nella reference (`docs/reference/mascots/`) niente è
 * simmetrico — una spalla è più alta dell'altra, le due orecchie non sono uguali, la coda
 * finisce a punta. La prima versione era fatta di uova simmetriche e si vedeva.
 */
import { Face, type FaceSpec } from "./face";
import { CharacterFrame, Mass } from "./frame";
import type { CharacterProps } from "./types";

const FACE: FaceSpec = {
  eyes: [
    { x: 36, y: 50 },
    { x: 64, y: 49 },
  ],
  rx: 14,
  ry: 14.5,
};

export function Owl(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <Mass>
        <path d="M27 32C22 21 22 13 26 11C30 9 34 17 36 24Z" />
        <path d="M73 31C77 22 78 15 75 13C71 11 67 18 65 24Z" />
        <path d="M50 19C67 19 80 31 82 50C85 61 87 73 84 81C80 90 65 93 49 93C33 93 17 90 14 81C12 72 14 60 18 49C20 31 33 19 50 19Z" />
      </Mass>
      <Face spec={FACE} mood={props.mood} />
      <path data-parte="becco" d="M50 72 42 58C46 56 55 56 58 58Z" fill="var(--color-paper)" stroke="none" />
    </CharacterFrame>
  );
}
