/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    "next/core-web-vitals",
    "prettier"
  ],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
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
    "turbo/no-undeclared-env-vars": "off",
    // Disable Next.js script warnings
    "@next/next/no-sync-scripts": "off",
    "@next/next/inline-script-id": "off",

    // Add useful warnings
    "react/jsx-key": "warn",                    // Warn about missing key props in iterators
    "react/self-closing-comp": "warn",          // Suggest self-closing tags
    "react/jsx-curly-brace-presence": "warn",   // Suggest when to use curly braces in JSX
    "@typescript-eslint/no-empty-function": "warn", // Warn about empty functions
    "@typescript-eslint/prefer-optional-chain": "warn", // Suggest optional chaining
    "prefer-const": "warn",                     // Suggest const when variables aren't reassigned
    "no-duplicate-imports": "warn",             // Warn about duplicate imports
    "no-unneeded-ternary": "warn",             // Suggest simpler alternatives to ternaries
    "arrow-body-style": ["warn", "as-needed"]   // Suggest shorter arrow functions when possible
  }
}
