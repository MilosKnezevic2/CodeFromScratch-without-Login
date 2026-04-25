import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", ".next", "lib/generated/**"],
    // Some services (MFA enrolment creates 10 bcrypt hashes at cost 12)
    // take longer than Vitest's 5s default. 30s is a generous ceiling.
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
