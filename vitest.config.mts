import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // I test girano in Node, quindi possono importare `src/server/**`. Il pacchetto
      // `server-only` serve a impedire l'import dal bundle del browser: qui lo si neutralizza
      // (la sua versione "react-server" è un file vuoto). L'ESLint continua a imporre i confini.
      "server-only": fileURLToPath(new URL("./node_modules/server-only/empty.js", import.meta.url)),
    },
  },
  test: { include: ["src/**/*.test.ts", "scripts/**/*.test.ts"], environment: "node" },
});
