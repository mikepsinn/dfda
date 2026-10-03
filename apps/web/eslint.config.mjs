// ESLint 9 flat config, equivalent to the former .eslintrc.json
// (next/core-web-vitals + next/typescript, with the same two rules turned off).
//
// eslint-config-next 15 still ships legacy presets, so FlatCompat translates
// next/core-web-vitals. next/typescript is reproduced from typescript-eslint
// directly: through the preset, ESLint loaded eslint-config-next's own copy of
// @typescript-eslint/eslint-plugin 7.x, whose no-unused-expressions rule crashes on
// ESLint 9. This app's typescript-eslint 8.x supports ESLint 9.
import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import typescriptEslint from "@typescript-eslint/eslint-plugin";

// Resolve the preset's plugins from eslint-config-next itself, so its matching
// @next/eslint-plugin-next is used rather than an older copy hoisted from another
// workspace package.
const require = createRequire(import.meta.url);
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  resolvePluginsRelativeTo: dirname(require.resolve("eslint-config-next/package.json")),
});

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "dfda-patient-dashboard/**"] },
  ...compat.extends("next/core-web-vitals"),
  // next/typescript: typescript-eslint's recommended rules, with these two as warnings.
  ...typescriptEslint.configs["flat/recommended"],
  {
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react/no-unescaped-entities": "off",
    },
  },
];

export default config;
