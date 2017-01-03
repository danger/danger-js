module.exports = (wallaby) => ({
  files: [
    {pattern: "source/**/fixtures/**/*.*", instrument: false},
    "source/**/!(*.test).js",
    {pattern: "package.json", instrument: false}
  ],

  tests: [
    "source/**/*.test.js"
  ],

  env: {
    type: "node"
  },

  compilers: {
    "**/*.js?(x)": wallaby.compilers.babel()
  },

  // fixtures are not instrumented, but still need to be compiled
  preprocessors: {
    "source/**/fixtures/**/*.js?(x)": file => require('babel-core')
      .transform(
        file.content,
        JSON.parse(require('fs').readFileSync(require('path').join(__dirname, '.babelrc'))))
  },

  testFramework: "jest"
})
