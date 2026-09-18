"use client";

/**
 * Riga di attesa della carta (F3-03, F4-02, F4-06, F5-05): sta al posto dei comandi
 * dell'altro posto. Dice cosa sta facendo chi deve agire, così chi guarda sa che non
 * deve fare nulla — senza vedere il campo di risposta dell'altro.
 */
export function WaitingRow({ text }: { text: string }) {
  return (
    <p role="status" className="border-2 border-dashed border-ink/50 px-3 py-2 font-sans text-sm italic">
      {text}
    </p>
  );
}
