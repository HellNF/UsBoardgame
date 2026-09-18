"use client";

import { useSyncExternalStore } from "react";

/**
 * Falso mentre disegna il server, vero nel browser (D-60).
 *
 * Serve per tutto quello che dipende dall'orologio: il tempo che manca di una sfida e il
 * segnale dei riflessi cambiano di secondo in secondo, quindi il server e il browser
 * scriverebbero due testi diversi e React butterebbe via l'albero appena idratato
 * («Hydration failed because the server rendered text didn't match the client»).
 *
 * È `useSyncExternalStore` e non un `useState` mosso da un effetto perché la regola
 * `react-hooks/set-state-in-effect` — giustamente — vieta la seconda strada.
 *
 * Da D-82 nessuna carta lo usa più: il conto alla rovescia della sfida è sparito con il timer.
 * Resta qui per il conto che sale che il proprietario sta rifacendo, e per il segnale dei riflessi.
 */
const subscribeToNothing = (): (() => void) => () => {};

export const useHydrated = (): boolean =>
  useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );
