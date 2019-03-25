module.exports = {
  "env": {
    "node": true,
  },
  "globals": {
    "Promise": true,
    "Set": true,
  },
  "parser": "babel-eslint",
  "plugins": [
    "html",
  ],
  "rules": {
    "comma-dangle": ["error", "always-multiline"],
    "extends": "eslint:recommended",
    "max-len": ["error", { "code": 120, "ignoreRegExpLiterals": true, "ignoreUrls": true, "tabWidth": 2 }],
    "no-undef": "error",
    "no-unused-expressions": "error",
    "no-unused-vars": "error",
    "no-use-before-define": ["error", "nofunc"],
    "quotes": ["error", "double", "avoid-escape"],
    "semi": ["error", "never"],
  }
}
