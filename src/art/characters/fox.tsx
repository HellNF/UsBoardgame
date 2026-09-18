/**
 * Volpe — personaggio `fox`.
 *
 * La **coda grande quanto lei**, con la **punta di carta**: è quello che la separa dal gatto,
 * che ha la coda sottile e senza punta. Ed è anche come è fatta una volpe vera, che non capita
 * spesso quando si disegna per contrasto invece che per verità.
 *
 * La coda esce dal **fianco** e sale lungo il lato destro. Le versioni precedenti la facevano
 * uscire dalla spalla, e a quel punto era un'ala; prima ancora era un nastro che andava e
 * tornava, e il vuoto in mezzo la faceva sembrare il manico di una tazza.
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
    { x: 30, y: 57 },
    { x: 52, y: 56 },
  ],
  rx: 11.5,
  ry: 12,
  mouth: { x: 41, y: 77, w: 12 },
};

export function Fox(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <Mass>
        <path d="M62 84C82 94 98 82 98 58C98 46 86 45 85 60C84 74 74 80 60 72Z" />
        <path d="M14 50C8 34 5 14 10 9C15 4 25 16 30 23L43 37Z" />
        <path d="M66 45C72 30 74 12 70 8C65 3 56 15 51 22L42 35Z" />
        <path d="M42 26C57 26 66 37 67 51C72 58 74 66 73 76C72 88 57 92 41 92C24 91 11 87 9 76C7 65 13 57 16 50C17 37 27 26 42 26Z" />
      </Mass>
      <Face spec={FACE} mood={props.mood} />
      <ellipse data-parte="punta" cx="91" cy="55" rx="8" ry="9" fill="var(--color-paper)" stroke="none" />
    </CharacterFrame>
  );
}
