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
export {
  BOARD,
  CELL,
  DECORATION_INSET,
  LADDER_HALF_WIDTH,
  LADDER_STROKE,
  SNAKE_AMPLITUDE,
  SNAKE_BODY_WIDTH,
  cellCenter,
  cellCorner,
  cellRect,
  cellsAlongPath,
  crossedCells,
  isBorderCell,
  ladderAxis,
  ladderRungs,
  samplePath,
  snakeBodyPoints,
  smoothPath,
  type CrossedOptions,
  type LadderAxis,
  type Point,
} from "./board-geometry";
export { generateBoard, type BoardGeneratorOptions, type IllustrationPool } from "./board-generator";
export {
  READABILITY_BUDGET,
  addLine,
  describeBudget,
  fitsBudget,
  measureReadability,
  readabilityState,
  type ReadabilityBudget,
  type ReadabilityMeasure,
  type ReadabilityState,
} from "./board-readability";
export { createInitialState, reduce } from "./reducer";
export * from "./minigames";

/**
 * Gli strumenti per i test (disposizione di prova e `EngineContext` finto) stanno in
 * `src/engine/testing.ts` e **non** si esportano da qui: li importano direttamente i file
 * `*.test.ts`, così non finiscono nel bundle dell'applicazione.
 */
