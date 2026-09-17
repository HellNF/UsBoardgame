export * from "./types";
export { RULES } from "./config";
export {
  cellToCoord,
  coordToCell,
  rowOf,
  clampCell,
  ladderAt,
  snakeAt,
  nearestLadderAhead,
  nearestSnakeHeadBehind,
} from "./board";
export { validateBoard, assertValidBoard } from "./board-validation";
export { createInitialState, reduce } from "./reducer";
export * from "./minigames";

/**
 * Gli strumenti per i test (disposizione di prova e `EngineContext` finto) stanno in
 * `src/engine/testing.ts` e **non** si esportano da qui: li importano direttamente i file
 * `*.test.ts`, così non finiscono nel bundle dell'applicazione.
 */
