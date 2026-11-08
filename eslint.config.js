const eslint = require("@eslint/js");
const prettier = require("eslint-config-prettier");
const globals = require("globals");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");

module.exports = [
  { ignores: ["build/**", "node_modules/**"] },
  eslint.configs.recommended,
  {
    settings: {
      react: { version: "detect" },
    },
  },
  react.configs.flat.recommended,
  react.configs.flat["jsx-runtime"],
  {
    files: ["src/**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, process: "readonly" },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react/prop-types": "off",
    },
  },
  {
    files: ["*.config.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "commonjs",
      globals: globals.node,
    },
  },
  prettier,
];
