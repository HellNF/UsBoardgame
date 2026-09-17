/**
 * Numero e nome concordati: «1 moneta», «2 monete».
 * Serve nei riepiloghi (pannello, schermata finale, riga di controllo degli scenari),
 * dove scrivere "1 stelle" si nota subito.
 */
export function plural(count: number, one: string, many: string): string {
  return `${count} ${count === 1 ? one : many}`;
}
