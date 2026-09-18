/**
 * Coniglio — personaggio `rabbit`.
 *
 * Le orecchie sono **larghe e lunghe**, non due spine — sottili facevano un topo — e una è più
 * dritta dell'altra, che è l'unica ragione per cui sembra disegnato a mano e non stampato.
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
    { x: 39, y: 61 },
    { x: 61, y: 60 },
  ],
  rx: 11.5,
  ry: 12,
  mouth: { x: 50, y: 80, w: 12 },
};

export function Rabbit(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <Mass>
        <path d="M37 47C29 37 23 18 27 10C31 3 41 8 42 23C43 34 39 43 37 47Z" />
        <path d="M63 46C72 38 80 22 77 14C74 7 64 11 61 25C59 36 62 43 63 46Z" />
        <path d="M51 40C63 40 72 48 73 59C78 65 82 72 81 80C80 90 66 93 50 93C34 93 19 90 19 79C19 71 23 65 28 59C29 48 39 40 51 40Z" />
      </Mass>
      <Face spec={FACE} mood={props.mood} />
    </CharacterFrame>
  );
}
