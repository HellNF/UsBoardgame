"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { useRive } from "@rive-app/react-canvas";

/**
 * Caricamento dei file Rive (`public/rive/`, docs/design.md § Animazioni Rive).
 *
 * I `.riv` li disegna il proprietario nell'editor e non sono ancora in `public/rive/`: finché
 * non ci sono, ogni wrapper mostra il suo segnaposto geometrico. Il file si cerca **una volta
 * per sessione** (una richiesta `HEAD`, condivisa da tutte le pedine della stessa partita) e
 * l'esito resta in memoria: quando il file compare, il wrapper lo prende al primo disegno dopo
 * il caricamento della pagina.
 *
 * `useSyncExternalStore` e non uno stato dentro `useEffect`: lo stato vive fuori da React, come
 * in `useHydrated` (D-60), e `react-hooks/set-state-in-effect` non ammette `setState` in un
 * effetto. Sul server la risposta è sempre «non c'è», così il primo disegno è il segnaposto e
 * non si disallinea l'idratazione.
 */
const availability = new Map<string, boolean>();
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

function probe(file: string) {
  if (availability.has(file)) return;
  availability.set(file, false);
  fetch(`/rive/${file}`, { method: "HEAD" })
    .then((response) => availability.set(file, response.ok))
    .catch(() => availability.set(file, false))
    .then(notify);
}

/** Il file esiste in `public/rive/`? */
export function useRiveFile(file: string): boolean {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      probe(file);
      return () => {
        listeners.delete(listener);
      };
    },
    () => availability.get(file) ?? false,
    () => false,
  );
}

export type RiveInputs = {
  /** Ingressi che scattano: il valore è un contatore, l'ingresso scatta quando cambia. */
  triggers?: Record<string, number | undefined>;
  /** Ingressi booleani: nome dell'ingresso → valore. */
  booleans?: Record<string, boolean>;
  /** Ingressi numerici: nome dell'ingresso → valore. */
  numbers?: Record<string, number | undefined>;
};

/**
 * Il disegno Rive, con gli ingressi della macchina a stati applicati dall'esterno.
 *
 * Gli ingressi arrivano come oggetti nuovi a ogni disegno: l'effetto si accorge di un cambio
 * confrontando la loro forma serializzata, e i trigger si ricordano l'ultimo valore per non
 * riscattare a ogni disegno.
 */
export function RiveCanvas({
  file,
  artboard,
  stateMachine,
  inputs,
  className,
}: {
  file: string;
  artboard?: string;
  stateMachine?: string;
  inputs?: RiveInputs;
  className?: string;
}) {
  const { rive, RiveComponent } = useRive({
    src: `/rive/${file}`,
    artboard,
    stateMachines: stateMachine,
    autoplay: true,
  });

  const triggerSpec = JSON.stringify(inputs?.triggers ?? {});
  const booleanSpec = JSON.stringify(inputs?.booleans ?? {});
  const numberSpec = JSON.stringify(inputs?.numbers ?? {});
  const fired = useRef<Record<string, number>>({});

  // Gli ingressi si prendono dalla macchina a stati per nome: `input.fire()` per i trigger,
  // `input.value = …` per booleani e numeri (API di `@rive-app/canvas`).
  useEffect(() => {
    if (!rive || !stateMachine) return;
    const machineInputs = rive.stateMachineInputs(stateMachine);
    if (!machineInputs) return;
    const triggers: Record<string, number | undefined> = JSON.parse(triggerSpec);
    for (const [name, value] of Object.entries(triggers)) {
      if (value === undefined || fired.current[name] === value) continue;
      fired.current[name] = value;
      machineInputs.find((input) => input.name === name)?.fire();
    }
  }, [rive, stateMachine, triggerSpec]);

  useEffect(() => {
    if (!rive || !stateMachine) return;
    const machineInputs = rive.stateMachineInputs(stateMachine);
    if (!machineInputs) return;
    const booleans: Record<string, boolean> = JSON.parse(booleanSpec);
    for (const [name, value] of Object.entries(booleans)) {
      const input = machineInputs.find((candidate) => candidate.name === name);
      if (input) input.value = value;
    }
  }, [rive, stateMachine, booleanSpec]);

  useEffect(() => {
    if (!rive || !stateMachine) return;
    const machineInputs = rive.stateMachineInputs(stateMachine);
    if (!machineInputs) return;
    const numbers: Record<string, number | undefined> = JSON.parse(numberSpec);
    for (const [name, value] of Object.entries(numbers)) {
      if (value === undefined) continue;
      const input = machineInputs.find((candidate) => candidate.name === name);
      if (input) input.value = value;
    }
  }, [rive, stateMachine, numberSpec]);

  return <RiveComponent className={className} />;
}
