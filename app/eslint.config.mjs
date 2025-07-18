import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import imports from "eslint-plugin-import";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
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
    files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
    ...react.configs.flat.recommended,
    ...react.configs.flat["jsx-runtime"],
    ...reactHooks.configs["recommended-latest"],
    languageOptions: {
      ...react.configs.flat.recommended.languageOptions
    }
  }
);
