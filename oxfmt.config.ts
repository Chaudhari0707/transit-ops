export default {
  printWidth: 100,
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  tabWidth: 2,
  arrowParens: "always",
  sortTailwindcss: {
    stylesheet: "./src/app/globals.css",
    functions: ["cn", "clsx", "cva"],
  },
  sortPackageJson: {
    sortScripts: true,
  },
  sortImports: {
    // Mirrors the original import sort groups:
    //   Group 1: ["^\u0000"]                       → bare side-effect imports
    //   Group 2: ["^node:"]                       → Node.js built-in modules
    //   Group 3: ["^react$","^next","^@?\\w"]      → react → next → all other external packages
    //   Group 4: ["^@/"]                          → internal @/ alias imports
    //   Group 5: ["^\\."]                         → relative imports
    customGroups: [
      {
        groupName: "react",
        elementNamePattern: ["react"],
      },
      {
        groupName: "next",
        elementNamePattern: ["next", "next/**"],
      },
    ],
    groups: [
      "side_effect",
      ["value-builtin", "type-builtin"],
      "react",
      { newlinesBetween: false },
      "next",
      { newlinesBetween: false },
      ["value-external", "type-external"],
      ["value-internal", "type-internal"],
      ["value-parent", "type-parent", "value-sibling", "type-sibling", "value-index", "type-index"],
      "style",
      "unknown",
    ],
  },
};
