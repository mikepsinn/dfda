/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: ["@repo/eslint-config/next.js"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: true,
  },
  plugins: ["unused-imports"],
  rules: {
    "unused-imports/no-unused-imports": "error",
    "unused-imports/no-unused-vars": [
      "warn",
      { 
        "vars": "all", 
        "varsIgnorePattern": "^_", 
        "args": "after-used", 
        "argsIgnorePattern": "^_" 
      }
    ]
  }
};
