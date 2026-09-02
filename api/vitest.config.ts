import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    setupFiles: ["./test/helpers/setup.ts"],
    fileParallelism: false
  }
});
