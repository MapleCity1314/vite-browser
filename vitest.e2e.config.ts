import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/evals-e2e/**/*.test.ts"],
    exclude: ["dist/**", "node_modules/**"],
    testTimeout: 120_000,
    hookTimeout: 120_000,
    reporters: ["default"],
  },
});
