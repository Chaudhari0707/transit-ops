import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
  },
  plugins: ["react", "nextjs", "typescript", "jsx-a11y", "import", "unicorn", "oxc"],
  ignorePatterns: [
    ".next/**/*",
    "out/**/*",
    "build/**/*",
    "next-env.d.ts",
    ".agents/**/*",
    ".claude/**/*",
    "lint-rules/dist/**/*",
  ],
  jsPlugins: ["./lint-rules/dist/index.js"],
  rules: {
    "local/no-nodejs-imports": "error",
    "local/no-nodejs-in-client": "error",
    "local/prefer-src-alias": "error",
    "local/no-exported-types-in-source": "error",
    "local/require-live-form-validation": "error",
    "local/sort-types-and-keys": "error",
    "local/tailwind-canonical-classes": "warn",
    "no-unused-vars": [
      "warn",
      {
        args: "after-used",
        argsIgnorePattern: "^_",
        caughtErrors: "all",
        caughtErrorsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
        ignoreRestSiblings: true,
        varsIgnorePattern: "^_",
      },
    ],
    "no-restricted-properties": [
      "error",
      {
        object: "process",
        property: "argv",
        message: "Use Bun.argv instead of process.argv in Bun-managed files.",
      },
      {
        object: "process",
        property: "cwd",
        message:
          "Resolve paths from import.meta.url or a file-local root instead of process.cwd in Bun-managed files.",
      },
      {
        object: "process",
        property: "env",
        message: "Use Bun.env instead of process.env in Bun-managed files.",
      },
      {
        object: "process",
        property: "exit",
        message: "Use Bun.exit instead of process.exit in Bun-managed files.",
      },
    ],
    "sort-imports": [
      "error",
      {
        ignoreDeclarationSort: true,
        ignoreCase: true,
      },
    ],
    "jsx-a11y/prefer-tag-over-role": "off",
    "typescript/consistent-type-imports": "error",
    "typescript/no-explicit-any": "error",
  },
  overrides: [
    {
      files: ["src/**/*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}"],
      rules: {
        "no-restricted-imports": [
          "error",
          {
            patterns: [
              {
                regex: "^(?:\\.\\./)+",
                message: "Use @/ absolute imports instead of parent-relative imports inside src.",
              },
            ],
          },
        ],
      },
    },
  ],
});
