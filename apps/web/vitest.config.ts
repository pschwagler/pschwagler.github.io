import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "~": path.resolve(__dirname, "app"),
      "@content": path.resolve(__dirname, "../../content"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", "build", ".react-router"],
    passWithNoTests: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
