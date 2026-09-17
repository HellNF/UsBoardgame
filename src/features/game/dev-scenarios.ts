import { challenges } from "@/content/challenges";
import { questions } from "@/content/questions";
import { MINIGAMES } from "@/engine";
import type { ActiveCard, EventCardId, GameState, ItemId, MinigameId, PlayerState, Seat } from "@/engine";

/**
 * Scenari della pagina `/dev/scenari`: **stati fissati a mano**, uno per ogni carta e
 * schermata che in partita capita di rado. Servono a guardare in un colpo solo le carte
 * che il proprietario non è ancora riuscito a vedere giocando.
 *
 * Niente è pescato a caso: ogni stato dichiara la carta, il posto di turno, le posizioni
 * e i conti. L'unica cosa calcolata al momento è la **scadenza dei timer**, così il conto
 * alla rovescia parte quando si apre la pagina (`startState`).
 *
 * Solo per lo sviluppo: la pagina risponde 404 in produzione come `/dev/hotseat` e `/dev/ui`.
 */

/** Nomi dei posti nella pagina di prova (gli stessi di `/dev/ui`). */
export const SCENARIO_NAMES: Record<Seat, string> = { 1: "Leo", 2: "Marta" };

export type Scenario = {
  id: string;
  /** Titolo dello scenario. */
  title: string;
  /** Una riga: cosa si deve vedere. */
  description: string;
  /** Stato di partenza, fissato a mano. */
  state: GameState;
  /** Secondi che mancano alla scadenza: il timer parte quando si apre la pagina. */
  deadlineSeconds?: number;
  /** Solo per i riflessi: fra quanti secondi arriva il segnale (il resto lo fa il motore). */
  signalSeconds?: number;
  /** Solo per la schermata finale: stelle bonus già calcolate (null in pareggio). */
  bonus?: { knowItAll: Seat | null; champion: Seat | null };
};

// ---------------------------------------------------------------------------
// Costruzione degli stati
// ---------------------------------------------------------------------------

type PlayerOverrides = Partial<Omit<PlayerState, "seat">>;

function player(seat: Seat, position: number, overrides: PlayerOverrides = {}): PlayerState {
  return {
    seat,
    position,
    coins: 0,
    stars: 0,
    items: [],
    finishedAtRound: null,
    stats: { correctAnswers: 0, challengesWon: 0 },
    ...overrides,
  };
}

type StateInit = {
  card: ActiveCard | null;
  turn?: Seat;
  phase?: GameState["phase"];
  round?: number;
  players?: Record<Seat, PlayerState>;
  arrivalCell?: number | null;
  handled?: GameState["handled"];
  winner?: GameState["winner"];
};

/** Stato di partenza comune: carta aperta in risoluzione, tocca al posto 1. */
function scenarioState(init: StateInit): GameState {
  return {
    version: 1,
    round: init.round ?? 4,
    turn: init.turn ?? 1,
    firstSeat: 1,
    phase: init.phase ?? "resolving",
    players: init.players ?? { 1: player(1, 30), 2: player(2, 27) },
    lastRoll: null,
    card: init.card,
    itemUsedThisTurn: null,
    forcedDie: null,
    singleDie: false,
    winner: init.winner ?? null,
    arrivalCell: init.arrivalCell ?? null,
    handled: init.handled ?? { ladder: false, snake: false },
  };
}

/** Carta domanda dal catalogo vero: tipo e categoria li detta la domanda, non lo scenario. */
function questionCard(
  questionId: string,
  options: { forLadder?: boolean; givenAnswer?: string | null } = {},
): Extract<ActiveCard, { type: "question" }> {
  const found = questions.find((question) => question.id === questionId);
  if (!found) throw new Error(`Scenario: domanda sconosciuta \`${questionId}\`.`);
  return {
    type: "question",
    questionId: found.id,
    kind: found.kind,
    category: found.category,
    forLadder: options.forLadder ?? false,
    givenAnswer: options.givenAnswer ?? null,
  };
}

/** Generatore deterministico per l'avvio dei minigiochi (memory mischia il mazzo). */
function scriptedRandomInt(): (max: number) => number {
  let step = 0;
  return (max) => {
    step = (step + 3) % Math.max(1, max);
    return step % Math.max(1, max);
  };
}

/** Carta sfida dal catalogo vero, con i campi che lo scenario vuole cambiare. */
function challengeCard(
  challengeId: string,
  overrides: Partial<Extract<ActiveCard, { type: "challenge" }>> = {},
): Extract<ActiveCard, { type: "challenge" }> {
  const found = challenges.find((challenge) => challenge.id === challengeId);
  if (!found) throw new Error(`Scenario: sfida sconosciuta \`${challengeId}\`.`);
  const minigameId = (found.minigame as MinigameId | undefined) ?? null;
  const quiz = found.quiz ?? null;
  return {
    type: "challenge",
    challengeId: found.id,
    mode: found.mode,
    verdict: found.verdict,
    prize: found.prize,
    snakeFlash: found.snakeFlash,
    deadlineAt: null,
    claims: {},
    disputeChoices: {},
    disputed: false,
    minigameId,
    minigame: minigameId
      ? MINIGAMES[minigameId].init({ ...SCENARIO_CLOCK, randomInt: scriptedRandomInt(), firstSeat: 1, content: quiz })
      : null,
    quiz,
    ...overrides,
  };
}

/** Orologio fisso degli scenari: i minigiochi a tempo partono sempre dallo stesso istante. */
const SCENARIO_CLOCK = { now: new Date("2026-09-17T21:00:00.000Z") };

/** Carta imprevisto: l'id è fissato, la pesca a caso non serve. */
const eventCard = (eventId: EventCardId): Extract<ActiveCard, { type: "event" }> => ({
  type: "event",
  eventId,
});

/** Chi ha appena pescato la carta è sulla casella d'arrivo e l'effetto è già stato segnato. */
const arrived = (position: number, handled: GameState["handled"]) => ({
  arrivalCell: position,
  handled,
});

const NO_EFFECT = { ladder: false, snake: false } as const;
const LADDER_DONE = { ladder: true, snake: false } as const;
const SNAKE_DONE = { ladder: false, snake: true } as const;

// ---------------------------------------------------------------------------
// Scenari
// ---------------------------------------------------------------------------

/** Un imprevisto per ognuno dei sette (docs/rules.md § Imprevisti). */
const EVENT_SCENARIOS: { id: EventCardId; title: string; description: string; position: number }[] = [
  {
    id: "tailwind",
    title: "Imprevisto · Vento a favore",
    description: "Premi «Continua»: la pedina va dalla 60 alla 65, senza effetti a catena.",
    position: 60,
  },
  {
    id: "wrong_path",
    title: "Imprevisto · Sentiero sbagliato",
    description: "Premi «Continua»: la pedina torna dalla 40 alla 35.",
    position: 40,
  },
  {
    id: "gift",
    title: "Imprevisto · Regalo",
    description: "Premi «Continua»: l'altro ti dà 3 monete (Leo 5 → 8, Marta 8 → 5).",
    position: 40,
  },
  {
    id: "treasure",
    title: "Imprevisto · Tesoro",
    description: "Premi «Continua»: ricevi un oggetto a caso fra i sette.",
    position: 40,
  },
  {
    id: "sudden_snake",
    title: "Imprevisto · Serpente improvviso",
    description: "Premi «Continua»: dalla 60 scende alla coda del serpente più vicino dietro (54 → 34).",
    position: 60,
  },
  {
    id: "lucky_ladder",
    title: "Imprevisto · Scala fortunata",
    description: "Premi «Continua»: dalla 60 sale sulla scala più vicina davanti (74 → 92), senza domanda.",
    position: 60,
  },
  {
    id: "snack_break",
    title: "Imprevisto · Pausa ghiotta",
    description: "Premi «Continua»: nessun effetto sulla partita, solo la pausa.",
    position: 40,
  },
];

export const SCENARIOS: Scenario[] = [
  // --- Domande -------------------------------------------------------------
  {
    id: "domanda-multiple-giusta",
    title: "Domanda a scelta multipla · verdetto giusto",
    description:
      "Scheda di prova: la risposta giusta è la prima opzione. Premila: verdetto automatico, +3 monete, carta chiusa.",
    state: scenarioState({
      card: questionCard("tastes-005"),
      players: { 1: player(1, 14), 2: player(2, 9) },
    }),
  },
  {
    id: "domanda-multiple-sbagliata",
    title: "Domanda a scelta multipla · verdetto sbagliato",
    description: "Premi un'opzione diversa dalla prima: verdetto sbagliato, nessuna moneta, carta chiusa.",
    state: scenarioState({
      card: questionCard("funny-002"),
      players: { 1: player(1, 25), 2: player(2, 19) },
    }),
  },
  {
    id: "domanda-breve-giusta",
    title: "Domanda breve · giudizio «Giusta»",
    description: "La risposta è già scritta: giudica l'altro con «Giusta», +3 monete.",
    state: scenarioState({
      card: questionCard("tastes-001", { givenAnswer: "Risotto ai funghi" }),
      players: { 1: player(1, 14), 2: player(2, 11) },
    }),
  },
  {
    id: "domanda-breve-quasi",
    title: "Domanda breve · giudizio «Quasi»",
    description: "Premi «Quasi»: +1 moneta, e non conta per la stella Sapientone (D-10).",
    state: scenarioState({
      card: questionCard("memories-001", { givenAnswer: "Il primo giorno di mare" }),
      players: { 1: player(1, 7), 2: player(2, 15) },
    }),
  },
  {
    id: "domanda-breve-sbagliata",
    title: "Domanda breve · giudizio «Sbagliata»",
    description: "Premi «Sbagliata»: nessuna moneta, nessuna penalità, carta chiusa.",
    state: scenarioState({
      card: questionCard("future-001", { givenAnswer: "Una casa in campagna" }),
      players: { 1: player(1, 21), 2: player(2, 23) },
    }),
  },
  {
    id: "domanda-aperta",
    title: "Domanda aperta",
    description: "Nessun verdetto e nessun giudizio: premi «Ne abbiamo parlato» (+1 moneta).",
    state: scenarioState({ card: questionCard("tastes-003"), players: { 1: player(1, 4), 2: player(2, 6) } }),
  },
  {
    id: "domanda-base-di-scala",
    title: "Domanda su base di scala",
    description:
      "Casella 8, base della scala 8 → 26: la domanda vale per la casella e per la scala. Rispondi con la prima opzione: +3 monete e pedina in cima alla scala.",
    state: scenarioState({
      card: questionCard("memories-008", { forLadder: true }),
      players: { 1: player(1, 8), 2: player(2, 5) },
      ...arrived(8, LADDER_DONE),
    }),
  },

  // --- Imprevisti ----------------------------------------------------------
  ...EVENT_SCENARIOS.map((event) => ({
    id: `imprevisto-${event.id}`,
    title: event.title,
    description: event.description,
    state: scenarioState({
      card: eventCard(event.id),
      players:
        event.id === "gift"
          ? { 1: player(1, event.position, { coins: 5 }), 2: player(2, 33, { coins: 8 }) }
          : { 1: player(1, event.position), 2: player(2, 33) },
      ...arrived(event.position, NO_EFFECT),
    }),
  })),

  // --- Stella e zaino ------------------------------------------------------
  {
    id: "stella-con-monete",
    title: "Offerta della stella · con monete sufficienti",
    description:
      "Leo ha 12 monete: «Compra la stella» (12 → 2 monete, +1 stella) oppure «No, grazie» senza pagare nulla.",
    state: scenarioState({
      card: { type: "star_offer" },
      players: { 1: player(1, 15, { coins: 12 }), 2: player(2, 20, { coins: 6 }) },
      ...arrived(15, NO_EFFECT),
    }),
  },
  {
    id: "stella-senza-monete",
    title: "Offerta della stella · senza monete sufficienti",
    description:
      "Leo ha 4 monete: il pulsante «Compra» è spento e dice quante ne mancano (in partita l'offerta non comparirebbe, D-35).",
    state: scenarioState({
      card: { type: "star_offer" },
      players: { 1: player(1, 53, { coins: 4 }), 2: player(2, 42, { coins: 20 }) },
      ...arrived(53, NO_EFFECT),
    }),
  },
  {
    id: "zaino-pieno",
    title: "Zaino pieno",
    description:
      "Tre oggetti in tasca e un quarto in arrivo: scegli cosa lasciare andare, oppure scarta quello nuovo.",
    state: scenarioState({
      card: { type: "item_overflow", incoming: "thief" as ItemId },
      players: {
        1: player(1, 40, { items: ["single_die", "loaded_die", "antidote"] }),
        2: player(2, 38),
      },
    }),
  },

  // --- Sfide ---------------------------------------------------------------
  {
    id: "sfida-duello-automatica",
    title: "Sfida duello automatica · tris",
    description:
      "Minigioco nel motore: clicca le caselle e gioca fino alla vittoria. Primo a muovere è chi ha pescato la carta.",
    deadlineSeconds: 180,
    state: scenarioState({
      card: challengeCard("tic-tac-toe"),
      players: { 1: player(1, 11), 2: player(2, 13) },
    }),
  },
  {
    id: "sfida-quiz-lampo",
    title: "Sfida a tempo · quiz-lampo",
    description:
      "Cinque domande a turno: chi risponde giusto prende un punto, alla fine la sfida si chiude da sola e paga il premio (F4-04). Prova anche «Guarda come posto 2»: risponde l'altro.",
    deadlineSeconds: 120,
    state: scenarioState({
      card: challengeCard("quiz-lampo"),
      players: { 1: player(1, 14), 2: player(2, 9) },
    }),
  },
  {
    id: "sfida-riflessi",
    title: "Sfida a tempo · riflessi",
    description:
      "Il segnale arriva dopo pochi secondi: chi tocca dopo prende il punto, chi tocca prima lo regala all'altro. Al meglio di cinque (F4-04).",
    deadlineSeconds: 120,
    signalSeconds: 4,
    state: scenarioState({
      card: challengeCard("riflessi"),
      players: { 1: player(1, 14), 2: player(2, 9) },
    }),
  },
  {
    id: "sfida-prova-giudizio",
    title: "Sfida prova a giudizio",
    description:
      "Gioca Leo, giudica Marta: 30 secondi sul timer. «Non riuscita» non dà il premio a nessuno (D-36).",
    deadlineSeconds: 30,
    state: scenarioState({
      card: challengeCard("mimo"),
      players: { 1: player(1, 19), 2: player(2, 15) },
    }),
  },
  {
    id: "sfida-doppia-conferma",
    title: "Doppia conferma · d'accordo",
    description:
      "Dichiarano entrambi: metti la stessa dichiarazione nelle due righe e la sfida si chiude col premio.",
    deadlineSeconds: 120,
    state: scenarioState({
      card: challengeCard("indovina-la-canzone"),
      players: { 1: player(1, 11), 2: player(2, 17) },
    }),
  },
  {
    id: "sfida-disaccordo",
    title: "Doppia conferma · in disaccordo",
    description:
      "Le dichiarazioni non coincidono: ognuno sceglie rivincita o moneta; se le scelte non coincidono decide il lancio di moneta (D-27).",
    state: scenarioState({
      card: challengeCard("karaoke-a-due", {
        disputed: true,
        claims: { 1: 1, 2: 2 },
      }),
      players: { 1: player(1, 11), 2: player(2, 17) },
    }),
  },
  {
    id: "sfida-lampo-serpente",
    title: "Sfida lampo del serpente",
    description:
      "Casella 62, testa del serpente 62 → 18: la prova dura 30 secondi e chi non vince scende alla coda.",
    deadlineSeconds: 30,
    state: scenarioState({
      card: challengeCard("funny-face"),
      players: { 1: player(1, 62), 2: player(2, 55) },
      ...arrived(62, SNAKE_DONE),
    }),
  },

  // --- Schermata finale ----------------------------------------------------
  {
    id: "finale-vince-posto-1",
    title: "Schermata finale · vince il posto 1",
    description:
      "Premi «Rivela la prossima stella»: Sapientone, Campione e poi il vincitore; la posta in palio si legge in cima.",
    bonus: { knowItAll: 1, champion: 2 },
    state: scenarioState({
      card: null,
      phase: "finished",
      winner: 1,
      round: 18,
      players: {
        1: player(1, 100, {
          coins: 18,
          stars: 3,
          finishedAtRound: 18,
          stats: { correctAnswers: 9, challengesWon: 4 },
        }),
        2: player(2, 96, { coins: 12, stars: 1, stats: { correctAnswers: 7, challengesWon: 6 } }),
      },
    }),
  },
  {
    id: "finale-vince-posto-2",
    title: "Schermata finale · vince il posto 2",
    description: "Stesse stelle bonus rivelate una alla volta, con l'ordine dei punteggi invertito.",
    bonus: { knowItAll: 2, champion: 2 },
    state: scenarioState({
      card: null,
      phase: "finished",
      winner: 2,
      round: 25,
      players: {
        1: player(1, 94, { coins: 21, stars: 1, stats: { correctAnswers: 6, challengesWon: 5 } }),
        2: player(2, 100, {
          coins: 15,
          stars: 4,
          finishedAtRound: 25,
          stats: { correctAnswers: 10, challengesWon: 7 },
        }),
      },
    }),
  },
  {
    id: "finale-pareggio",
    title: "Schermata finale · pareggio",
    description:
      "Stesse stelle e stesse monete: nessuna stella bonus a nessuno e «Pareggio» al posto del vincitore.",
    bonus: { knowItAll: null, champion: null },
    state: scenarioState({
      card: null,
      phase: "finished",
      winner: "draw",
      round: 21,
      players: {
        1: player(1, 99, { coins: 16, stars: 2, stats: { correctAnswers: 8, challengesWon: 3 } }),
        2: player(2, 97, { coins: 16, stars: 2, stats: { correctAnswers: 8, challengesWon: 3 } }),
      },
    }),
  },
];

/**
 * Stato pronto da giocare: copia dello scenario con il timer che parte adesso.
 * La scadenza si calcola qui e non nei dati perché `deadlineAt` è un istante assoluto.
 */
export function startState(scenario: Scenario): GameState {
  const copy = structuredClone(scenario.state);
  if (scenario.deadlineSeconds !== undefined && copy.card?.type === "challenge") {
    copy.card.deadlineAt = new Date(Date.now() + scenario.deadlineSeconds * 1000).toISOString();
  }
  // I riflessi: il segnale parte poco dopo l'apertura, così si vede anche l'attesa.
  if (scenario.signalSeconds !== undefined && copy.card?.type === "challenge" && copy.card.minigame?.kind === "reflex") {
    copy.card.minigame.goAt = new Date(Date.now() + scenario.signalSeconds * 1000).toISOString();
  }
  return copy;
}
