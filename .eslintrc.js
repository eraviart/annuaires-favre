module.exports = {
  env: {
    es6: true,
    node: true,
  },
  globals: {
    Promise: true,
    Set: true,
  },
  parser: "babel-eslint",
  plugins: ["svelte3"],
  rules: {
    "comma-dangle": ["error", "always-multiline"],
    extends: "eslint:recommended",
    "max-len": [
      "error",
      { code: 120, ignoreRegExpLiterals: true, ignoreUrls: true, tabWidth: 2 },
    ],
    "no-undef": "error",
    "no-unused-expressions": "error",
    "no-unused-vars": "error",
    "no-use-before-define": ["error", "nofunc"],
    quotes: ["error", "double", "avoid-escape"],
    semi: ["error", "never"],
    "svelte3/ignore-styles": true,
    "svelte3/lint-template": true,
  },
}
