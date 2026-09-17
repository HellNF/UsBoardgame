import { questionSchema, type QuestionContent } from "../schema";
import { deep } from "./deep";
import { funny } from "./funny";
import { future } from "./future";
import { memories } from "./memories";
import { tastes } from "./tastes";

export const questions: QuestionContent[] = [...tastes, ...memories, ...future, ...deep, ...funny].map((q) =>
  questionSchema.parse(q),
);
