module.exports = {
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: ["plugin:@typescript-eslint/recommended", "plugin:jest/recommended", "prettier"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: "tsconfig.spec.json",
    sourceType: "module",
  },
  plugins: ["eslint-plugin-jest", "eslint-plugin-jsdoc", "@typescript-eslint"],
  rules: {
    "@typescript-eslint/naming-convention": "error",
    "@typescript-eslint/no-empty-function": "error",
    "@typescript-eslint/no-unused-expressions": "error",

    // Something is grumpy about these rules re: node imports - TODO
    "@typescript-eslint/no-require-imports": "off",
    "@typescript-eslint/no-var-requires": "off",

    curly: "error",
    "jsdoc/check-alignment": "error",
    "jsdoc/check-indentation": "off",
    "jsdoc/newline-after-description": "off",
    "no-empty": "error",
    // This is used intentionally in a bunch of ci_source/providers
    "no-empty-function": "off",
    "no-redeclare": "error",
    "no-var": "error",
    // There are a bunch of existing uses of 'let' where this rule would trigger
    "prefer-const": "off",

    // This project has a ton of interacting APIs, and sometimes it's helpful to be explicit, even if the type is trivial
    "@typescript-eslint/no-inferrable-types": "off",

    "no-unused-expressions": "off",
    "@typescript-eslint/no-unused-expressions": "error",

    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      {
        // Allow function args to be unused
        args: "none",
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        caughtErrorsIgnorePattern: "^_",
      },
    ],

    "jest/no-disabled-tests": "warn",
    "jest/no-focused-tests": "error",
    "jest/no-identical-title": "error",
    "jest/prefer-to-have-length": "off",
    "jest/valid-expect": "error",
    "@typescript-eslint/no-non-null-assertion": "off",
    // Tons of violations in the codebase
    "@typescript-eslint/naming-convention": "off",
    // Used liberally in the codebase
    "@typescript-eslint/no-explicit-any": "off",
    // This has value in communicating with other Developers even if it has no functional effect.
    "@typescript-eslint/no-empty-interface": "off",
  },
}
