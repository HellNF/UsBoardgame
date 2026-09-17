"use client";

import { useEffect, useState, type ReactNode } from "react";

import type { Seat } from "@/engine";
import { AccessView } from "@/features/access/access-view";
import { DiaryView, type DiaryEntry, type DiaryViewProps } from "@/features/diary/diary-view";
import { LobbyView } from "@/features/lobby/lobby-view";
import { SheetView, type SheetQuestion } from "@/features/sheet/sheet-view";

/**
 * Le quattro schermate con lo stato finto della serata.
 * Presentazionale: nessun dato inventato qui dentro, li passa la pagina server;
 * qui vivono solo useState e le callback che le viste richiedono.
 */
export type DevViewsProps = {
  access: { roomCode?: string; otherConnected: boolean };
  lobby: {
    boardNames: { id: string; name: string }[];
    boardId: string;
    categoryOptions: { id: string; label: string }[];
    activeCategories: string[];
    maxChallengeSeconds: number;
    stake: string;
    pawns: Record<Seat, string>;
    colors: Record<Seat, string>;
    ready: Record<Seat, boolean>;
    names: Record<Seat, string>;
  };
  sheet: { seat: Seat; questions: SheetQuestion[]; answers: Record<string, string> };
  diary: { names: Record<Seat, string>; entries: DiaryEntry[]; archive: DiaryViewProps["archive"] };
};

/** Titolo di sezione della pagina di sviluppo. */
function DevSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-6">
      <h2 className="font-display text-3xl italic">{title}</h2>
      {children}
    </section>
  );
}

export function DevViews({ access, lobby, sheet, diary }: DevViewsProps) {
  const [otherConnected, setOtherConnected] = useState(access.otherConnected);
  const [seat, setSeat] = useState<Seat>(1);
  const [boardId, setBoardId] = useState(lobby.boardId);
  const [activeCategories, setActiveCategories] = useState(lobby.activeCategories);
  const [maxChallengeSeconds, setMaxChallengeSeconds] = useState(lobby.maxChallengeSeconds);
  const [stake, setStake] = useState(lobby.stake);
  const [ready, setReady] = useState(lobby.ready);
  const [answers, setAnswers] = useState(sheet.answers);
  const [saving, setSaving] = useState(false);

  // Salvataggio finto: l'indicatore della scheda torna a "Salvato" da solo.
  useEffect(() => {
    if (!saving) return;
    const timer = setTimeout(() => setSaving(false), 600);
    return () => clearTimeout(timer);
  }, [saving]);

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((current) => ({ ...current, [questionId]: answer }));
    setSaving(true);
  };

  const handleToggleCategory = (id: string) => {
    setActiveCategories((current) =>
      current.includes(id) ? current.filter((category) => category !== id) : [...current, id],
    );
  };

  const handleToggleReady = (seat: Seat) => {
    setReady((current) => ({ ...current, [seat]: !current[seat] }));
  };

  return (
    <div className="flex flex-col gap-20">
      <DevSection title="Accesso">
        {/* Demo: entrando nella stanza l'altro giocatore risulta collegato. */}
        <AccessView
          roomCode={access.roomCode}
          otherConnected={otherConnected}
          seat={seat}
          onSeatChange={setSeat}
          onJoin={() => setOtherConnected(true)}
        />
      </DevSection>

      <DevSection title="Lobby">
        <LobbyView
          boardNames={lobby.boardNames}
          boardId={boardId}
          onBoardChange={setBoardId}
          categoryOptions={lobby.categoryOptions}
          activeCategories={activeCategories}
          onToggleCategory={handleToggleCategory}
          maxChallengeSeconds={maxChallengeSeconds}
          onMaxChallengeSecondsChange={setMaxChallengeSeconds}
          stake={stake}
          onStakeChange={setStake}
          pawns={lobby.pawns}
          colors={lobby.colors}
          ready={ready}
          onToggleReady={handleToggleReady}
          names={lobby.names}
        />
      </DevSection>

      <DevSection title="Scheda">
        <SheetView
          seat={sheet.seat}
          questions={sheet.questions}
          answers={answers}
          onAnswer={handleAnswer}
          saving={saving}
        />
      </DevSection>

      <DevSection title="Diario">
        <DiaryView names={diary.names} entries={diary.entries} archive={diary.archive} />
      </DevSection>
    </div>
  );
}
