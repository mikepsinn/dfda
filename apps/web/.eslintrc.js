/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "next/core-web-vitals",
    "prettier"
  ],
  rules: {
    // Disable common annoying warnings
    "@next/next/no-img-element": "off",
    "react/no-unescaped-entities": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-unused-vars": "off",
    "no-unused-vars": "off",
    "no-console": "off",
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "react-hooks/exhaustive-deps": "off",
    "no-debugger": "off",
    "turbo/no-undeclared-env-vars": "off"
  }
}
