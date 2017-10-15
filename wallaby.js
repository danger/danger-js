module.exports = wallaby => {
  const babel = JSON.parse(require("fs").readFileSync(require("path").join(__dirname, ".babelrc")))
  babel.presets.push("babel-preset-jest")

  return {
    files: [
      "tsconfig.json",
      { pattern: "source/**/fixtures/**/*.*", instrument: false },
      "source/**/!(*.test).ts",
      { pattern: "package.json", instrument: false },
    ],

    tests: ["source/**/*.test.ts"],

    env: {
      type: "node",
    },

    compilers: {
      "**/*.ts?(x)": wallaby.compilers.typeScript(),
    },

    // fixtures are not instrumented, but still need to be compiled
    preprocessors: {
      "source/**/fixtures/**/*.js?(x)": file => require("babel-core").transform(file.content, babel),
    },

    testFramework: "jest",
  }
}
