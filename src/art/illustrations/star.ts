/**
 * Stella a cinque punte: le tre illustrazioni `stars-*` la usano per non ripetere la trigonometria.
 * Il percorso è chiuso e si può campire (`fill="currentColor"`) o lasciare in tratto.
 */
export function starPath(cx: number, cy: number, outer: number, inner: number): string {
  const points: string[] = [];
  for (let corner = 0; corner < 10; corner++) {
    const radius = corner % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 5) * corner - Math.PI / 2;
    const x = cx + radius * Math.cos(angle);
    const y = cy + radius * Math.sin(angle);
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`);
  }
  return `M ${points.join(" L ")} Z`;
}
