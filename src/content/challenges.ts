import { challengeSchema, type ChallengeContent } from "./schema";

/**
 * Carte sfida. Aggiungere una sfida = aggiungere un oggetto qui.
 * TODO(F4-01): completare il mazzo per le quattro categorie.
 */
const raw: ChallengeContent[] = [
  {
    id: "tic-tac-toe",
    name: "Tris",
    category: "builtin",
    mode: "duel",
    verdict: "automatic",
    durationSeconds: { min: 60, max: 180 },
    instructions: "Tre in fila vince. In caso di pareggio si rigioca.",
    prize: 3,
    snakeFlash: false,
    minigame: "tic-tac-toe",
  },
  {
    id: "funny-face",
    name: "Faccia buffa",
    category: "videocall",
    mode: "trial",
    verdict: "judge",
    durationSeconds: { min: 30, max: 30 },
    instructions: "Fai la faccia più buffa che puoi: l'altro giudica se l'hai fatto ridere.",
    prize: 2,
    snakeFlash: true,
  },
  {
    id: "lichess-blitz",
    name: "Lichess blitz 3 minuti",
    category: "external",
    mode: "duel",
    verdict: "double_confirm",
    durationSeconds: { min: 300, max: 480 },
    instructions: "Una partita blitz 3+0 su Lichess. Al ritorno dichiarate entrambi il vincitore.",
    prize: 5,
    snakeFlash: false,
    url: "https://lichess.org/",
  },
];

export const challenges: ChallengeContent[] = raw.map((c) => challengeSchema.parse(c));
