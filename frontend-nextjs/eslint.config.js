const { FlatCompat } = require("@eslint/eslintrc");

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [".next/**", "out/**", "dist/**", "node_modules/**", "*.config.js"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@next/next/no-img-element": "warn", // Changed to warn since we're using static export
      "@next/next/no-page-custom-font": "error",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
  {
    files: ["*.config.js", "*.config.ts"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
];

module.exports = eslintConfig;