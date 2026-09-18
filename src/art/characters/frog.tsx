/**
 * Rana — personaggio `frog`.
 *
 * L'unica macchia **larga e bassa**, con gli occhi **sopra** la testa su due bozzi di misura
 * diversa: due cose che non ha nessun altro, e che si leggono prima di qualsiasi dettaglio. La
 * bocca è larga quanto la faccia.
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
    { x: 31, y: 37 },
    { x: 68, y: 35 },
  ],
  rx: 12,
  ry: 12,
  mouth: { x: 50, y: 71, w: 26 },
};

export function Frog(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <Mass>
        <circle cx="31" cy="37" r="16" />
        <circle cx="68" cy="35" r="15" />
        <path d="M50 41C71 41 89 53 89 69C89 85 71 92 49 92C28 92 11 85 11 68C11 52 30 41 50 41Z" />
      </Mass>
      <Face spec={FACE} mood={props.mood} />
    </CharacterFrame>
  );
}
