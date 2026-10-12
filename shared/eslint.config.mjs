import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import { defineConfig } from "eslint/config";

export default defineConfig([
  { ignores: ["dist/**"] },
  { files: ["**/*.{js,mjs,cjs,ts,mts,cts}"], plugins: { js }, extends: ["js/recommended"] },
  prettier,
  tseslint.configs.recommended,
  {
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    }
  }
]);
