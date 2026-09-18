/**
 * La cornice comune dei sei personaggi: l'SVG, la pedana del colore e l'alone di carta.
 *
 * Il valore predefinito è **pieno e senza contorno** (`fill` d'inchiostro, `stroke` nessuno), e
 * non è un dettaglio tecnico: è l'idioma delle reference (`docs/reference/mascots/`). Là un
 * animale non è un contorno con dentro un colore, è **una macchia**. Il primo tentativo l'avevo
 * fatto all'opposto — contorni neri con dentro le tinte delle illustrazioni — e non
 * assomigliava a niente di quello che il proprietario aveva chiesto.
 *
 * Perché un SVG e non un canvas: la pedina sta **dentro** il tabellone, che è un SVG, e finora
 * per infilarci il canvas di Rive serviva un `foreignObject` (H2). Un `<svg>` annidato ci entra
 * da solo, come le illustrazioni delle caselle.
 */
import type { ReactNode } from "react";
import type { CharacterProps } from "./types";

const INK = "var(--color-ink)";

/**
 * La sagoma: tutte le forme dell'animale — testa, orecchie, coda — che diventano **una macchia
 * sola**.
 *
 * È il pezzo che fa funzionare lo stile. Le forme si sovrappongono e sono tutte dello stesso
 * inchiostro, senza contorno: quindi non c'è nessuna linea interna, e il bordo basso di un
 * orecchio non taglia la testa. Disegnare ogni forma col suo contorno — che è come avevo fatto
 * la prima volta — sfalda il disegno in pezzi.
 */
export function Mass({ children }: { children: ReactNode }) {
  return (
    <g data-parte="sagoma" fill={INK} stroke="none">
      {children}
    </g>
  );
}

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
      fill="var(--color-ink)"
      stroke="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": "true" })}
    >
      {/*
        L'alone di carta, la stessa soluzione delle scale e dei serpenti: il personaggio finisce
        anche sopra una casella sfida, che è nera, e una macchia d'inchiostro lì sparisce. È il
        disegno **ripetuto**, non un filtro e non un `<use>`: un filtro e un `<use>` hanno
        bisogno di un `id` unico nel documento, e di personaggi sul tabellone ce n'è più di uno.
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
 * La pedana: il colore del giocatore, che nel personaggio non c'è.
 *
 * Nelle reference non c'è niente sotto i piedi, ed è giusto: quei disegni sono solo inchiostro.
 * Ma il colore nel gioco vuol dire **di chi è la pedina**, e lo stesso animale lo può scegliere
 * chiunque dei due, quindi da qualche parte deve stare. Sta a terra, fuori dalla sagoma, così
 * la macchia resta pulita — e il numero del posto ci sta dentro perché a 34 px è quello che si
 * legge quando dell'animale si vede solo il profilo.
 */
function Pedana({ color, seat }: { color: NonNullable<CharacterProps["base"]>; seat?: number }) {
  return (
    <g data-parte="pedana">
      <ellipse cx="50" cy="91" rx="30" ry="7.5" fill={`var(--color-player-${color})`} />
      {seat === undefined ? null : (
        <text
          x="50"
          y="91"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="12"
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
