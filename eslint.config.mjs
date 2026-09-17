import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  // Il motore delle regole è puro: niente framework, niente I/O (docs/architecture.md).
  {
    files: ["src/engine/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["react", "react-dom", "next", "next/*"],
              message: "Il motore è puro: niente React/Next.",
            },
            {
              group: ["@supabase/*", "@/lib/*", "@/server/*", "@/features/*"],
              message: "Il motore è puro: niente I/O.",
            },
          ],
        },
      ],
    },
  },
  // Il codice client non importa mai il server né la secret key.
  {
    files: ["src/features/**", "src/components/**", "src/art/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: [{ group: ["@/server/*", "@/lib/supabase/admin"], message: "Solo lato server." }] },
      ],
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "src/lib/supabase/database.types.ts"]),
]);

export default eslintConfig;
