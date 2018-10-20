module.exports = wallaby => {
  return {
    files: [
      "tsconfig.json",
      { pattern: "source/**/fixtures/**/*.*", instrument: false },
      "source/**/!(*.test).ts",
      { pattern: "package.json", instrument: false },
    ],

    tests: [
      "source/**/*.test.ts",
      "!source/runner/runners/_tests/vm2.test.ts",
      "!source/runner/_tests/json-to-context.test.s",
    ],

    env: {
      type: "node",
    },

    // fixtures are not instrumented, but still need to be compiled
    preprocessors: {
      "source/**/fixtures/**/*.js?(x)": wallaby.compilers.babel(),
    },

    testFramework: "jest",
  }
}
