/**
 * Accesso — codice stanza, password, scelta del posto, stato dell'altro giocatore.
 * TODO(F0-05): form di accesso che chiama POST /api/rooms/join.
 */
export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="font-display text-5xl italic">Scale e serpenti</h1>
      <p className="text-sm tracking-wide uppercase">di coppia · in costruzione</p>
    </main>
  );
}
