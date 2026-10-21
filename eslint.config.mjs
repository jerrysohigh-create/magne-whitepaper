import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-pages/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "docs/**",
    "public/**",
    "temp/**",
    "services/mha-ledger/**", // Imported service has its own Python and JS tests.
  ]),
]);

export default eslintConfig;
