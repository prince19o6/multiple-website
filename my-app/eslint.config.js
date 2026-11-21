// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  {
    ignores: ["scripts/**", "**/scripts/**", "dist/**", ".expo/**"],
  },
  expoConfig,
  {
    rules: {
      "react-hooks/immutability": "off",
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/error-boundaries": "off",
      "react/no-unescaped-entities": "off",
    },
  }
]);
