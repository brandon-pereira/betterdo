import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-plugin-prettier/recommended";
import astro from "eslint-plugin-astro";

export default tseslint.config(
  eslint.configs.recommended,
  tseslint.configs.recommended,

  prettier,
  ...astro.configs.recommended,
  {
    languageOptions: {
      sourceType: "module"
    }
  },
  {
    ignores: [".astro"]
  }
);
