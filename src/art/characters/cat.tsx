/**
 * Gatto — personaggio `cat`.
 *
 * Il più vicino alla reference (`cats.png`), e il primo che ho disegnato: una macchia tonda e
 * lumacosa, due orecchie **sottili e appuntite** — la sinistra più grande, come nel disegno a
 * mano — e una coda che esce bassa a destra e finisce a punta. I baffi sono righe di carta
 * **dentro** la macchia: fuori sarebbero bianche su fondo bianco.
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
    { x: 38, y: 53 },
    { x: 62, y: 52 },
  ],
  rx: 12,
  ry: 12.5,
  mouth: { x: 50, y: 74, w: 12 },
};

export function Cat(props: CharacterProps) {
  return (
    <CharacterFrame {...props}>
      <Mass>
        <path d="M70 78C84 84 95 78 96 64C96.5 58 93 57 91 63C88 72 80 75 68 70Z" />
        <path d="M24 45C20 33 17 18 20 14C23 10 30 18 34 23L46 34Z" />
        <path d="M77 43C81 32 84 21 81 16C78 12 72 19 68 24L57 33Z" />
        <path d="M52 21C68 21 79 33 79 49C87 57 89 71 84 80C78 90 62 93 46 92C30 91 16 87 13 76C10 66 16 55 23 47C24 32 37 21 52 21Z" />
      </Mass>
      <Face spec={FACE} mood={props.mood} />
      <g data-parte="baffi" fill="none" stroke="var(--color-paper)" strokeWidth={2.4} strokeLinecap="round">
        <path d="M22 65 11 62M22 72 12 75" />
        <path d="M78 64 89 61M78 71 88 74" />
      </g>
    </CharacterFrame>
  );
}
