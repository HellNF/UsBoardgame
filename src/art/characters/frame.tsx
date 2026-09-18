/**
 * La cornice comune dei sei personaggi: l'SVG, la pedana del colore e i gruppi con un nome.
 *
 * Perché un SVG e non un canvas: la pedina sta **dentro** il tabellone, che è un SVG, e finora
 * per infilarci il canvas di Rive serviva un `foreignObject` (H2). Un `<svg>` annidato ci entra
 * da solo, come le illustrazioni delle caselle.
 *
 * I gruppi hanno un `id` in italiano (`coda`, `corpo`, `orecchie`, `testa`, `faccia`) e non è
 * decorazione: sono i pezzi che si muovono uno rispetto all'altro nell'animazione, e sono anche
 * i nomi che servirebbero per riggare lo stesso disegno nell'editor Rive
 * ([D-14](../../../docs/decisions.md)).
 */
import type { ReactNode } from "react";
import type { CharacterProps } from "./types";

export function CharacterFrame({
  x = 0,
  y = 0,
  size = 100,
  base,
  seat,
  className,
  label,
  children,
}: CharacterProps & { children: ReactNode }) {
  return (
    <svg
      x={x}
      y={y}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      stroke="currentColor"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" })}
    >
      {/*
        L'alone di carta, la stessa soluzione delle scale e dei serpenti: il personaggio finisce
        anche sopra una casella sfida, che è nera, e il gatto — che è blu notte — lì si perde. È
        il disegno **ripetuto**, non un filtro e non un `<use>`: un filtro e un `<use>` hanno
        bisogno di un `id` unico nel documento, e sul tabellone di personaggi ce n'è più di uno.
        Le regole CSS battono gli attributi di presentazione, quindi la copia esce tutta color
        carta e con il tratto grosso senza toccare i `fill` dei disegni.

        Sta **sotto la pedana**, e l'ordine è la correzione di un difetto visto renderizzando:
        con l'alone sopra, il suo tratto chiaro mordeva il bordo alto della pedana e il colore
        del giocatore veniva via a mezzaluna.
      */}
      <g aria-hidden="true" className="[&_*]:fill-paper [&_*]:stroke-paper [&_*]:[stroke-width:9]">
        {children}
      </g>
      {base ? <Pedana color={base} seat={seat} /> : null}
      {children}
    </svg>
  );
}

/**
 * La pedana: il colore del giocatore, che nel disegno non c'è.
 *
 * Il numero del posto ci sta dentro perché è quello che si legge quando la pedina è alta 34 px
 * sul tabellone e dell'animale si vede solo la sagoma — la stessa informazione che portava il
 * cerchio col numero di prima, e che così non si perde.
 */
function Pedana({ color, seat }: { color: NonNullable<CharacterProps["base"]>; seat?: number }) {
  return (
    <g data-parte="pedana">
      <ellipse cx="50" cy="89" rx="30" ry="8.5" fill={`var(--color-player-${color})`} />
      {seat === undefined ? null : (
        <text
          x="50"
          y="89"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="13"
          fontFamily="var(--font-sans)"
          fill="var(--color-paper)"
          stroke="none"
        >
          {seat}
        </text>
      )}
    </g>
  );
}
