import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import imports from "eslint-plugin-import";
import prettier from "eslint-plugin-prettier/recommended";

export default tseslint.config(
  { ignores: ["dist", "dev-dist", "postcss.config.cjs"] },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  prettier,
  {
    // TODO: eslint 10 added `no-useless-assignment` to the recommended set.
    // Demote to a warning for now so dep bumps don't require code changes.
    rules: {
      "no-useless-assignment": "warn"
    }
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    extends: [imports.flatConfigs.recommended, imports.flatConfigs.typescript],
    settings: {
      "import/resolver": {
        typescript: {
          project: import.meta.dirname + "/tsconfig.json"
        }
      }
    }
  },
  {
    languageOptions: {
      sourceType: "module",
      parserOptions: {
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    files: ["src/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    ...react.configs.flat.recommended,
    ...react.configs.flat["jsx-runtime"],
    ...reactHooks.configs.flat["recommended-latest"],
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions
    }
  },
  {
    // TODO: eslint-plugin-react-hooks 7 enabled the React Compiler rules by
    // default. Demote the newly-introduced rules to warnings for now so we can
    // address them incrementally; keep the two classic rules at their defaults.
    files: ["src/**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    rules: {
      "react-hooks/static-components": "warn",
      "react-hooks/use-memo": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/incompatible-library": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/globals": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/set-state-in-render": "warn",
      "react-hooks/unsupported-syntax": "warn",
      "react-hooks/config": "warn",
      "react-hooks/gating": "warn",
      "react-hooks/void-use-memo": "warn"
    }
  }
);
