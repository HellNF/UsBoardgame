/**
 * Orso — personaggio `bear`.
 *
 * La macchia più larga e più bassa dei sei, con due orecchie **rotonde** e diverse fra loro: è
 * quello che lo separa dal gatto a 34 px, insieme al fatto che non ha coda.
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
    { x: 39, y: 55 },
    { x: 61, y: 54 },
  ],
  rx: 11.5,
  ry: 12,
  mouth: { x: 50, y: 76, w: 13 },
};

export function Bear(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <Mass>
        <circle cx="25" cy="28" r="13" />
        <circle cx="76" cy="26" r="11.5" />
        <path d="M51 23C68 23 79 34 80 49C88 57 91 72 86 81C80 91 63 93 47 93C30 92 13 88 11 77C9 66 15 56 22 48C23 33 35 23 51 23Z" />
      </Mass>
      <Face spec={FACE} mood={props.mood} />
    </CharacterFrame>
  );
}
