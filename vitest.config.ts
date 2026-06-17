import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Unit tests for the PURE logic only — the status/threshold engine, the
 * allocation recommendation, and the cumulative flock arithmetic. No UI or
 * snapshot tests while the interface is still moving. The `@/*` alias mirrors
 * tsconfig so tests import the same way the app does.
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
});
