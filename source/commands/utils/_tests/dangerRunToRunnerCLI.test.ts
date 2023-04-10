import dangerRunToRunnerCLI from "../dangerRunToRunnerCLI"
import { addSubprocessCallArguments } from "../runDangerSubprocess"

describe("it can handle the command", () => {
  it("`danger ci`", () => {
    expect(dangerRunToRunnerCLI(["danger", "ci"])).toEqual("danger runner".split(" "))
  })

  it("`danger local`", () => {
    expect(dangerRunToRunnerCLI(["danger", "local"])).toEqual("danger runner".split(" "))
  })

  it("`danger ci --dangerfile myDangerfile.ts`", () => {
    expect(dangerRunToRunnerCLI(["danger", "ci", "--dangerfile", "myDangerfile.ts"])).toEqual(
      "danger runner --dangerfile myDangerfile.ts".split(" ")
    )
  })

  it("`node distribution/commands/danger-ci.js`", () => {
    expect(dangerRunToRunnerCLI(["node", "distribution/commands/danger-ci.js"])).toEqual(
      "node distribution/commands/danger-runner.js".split(" ")
    )
  })

  it("`node distribution/commands/danger-ci.js --dangerfile myDangerfile.ts`", () => {
    expect(
      dangerRunToRunnerCLI(["node", "distribution/commands/danger-ci.js", "--dangerfile", "myDangerfile.ts"])
    ).toEqual("node distribution/commands/danger-runner.js --dangerfile myDangerfile.ts".split(" "))
  })
})

it("`node distribution/commands/danger-ci.js --dangerfile 'myDanger file.ts'`", () => {
  expect(
    dangerRunToRunnerCLI(["node", "distribution/commands/danger-ci.js", "--dangerfile", "myDanger file.ts"])
  ).toEqual(["node", "distribution/commands/danger-runner.js", "--dangerfile", "myDanger file.ts"])
})

it("`node distribution/commands/danger-pr.js --dangerfile 'myDanger file.ts'`", () => {
  expect(
    dangerRunToRunnerCLI(["node", "distribution/commands/danger-pr.js", "--dangerfile", "myDanger file.ts"])
  ).toEqual(["node", "distribution/commands/danger-runner.js", "--dangerfile", "myDanger file.ts"])
})

it("`danger pr --dangerfile 'myDanger file.ts'`", () => {
  expect(dangerRunToRunnerCLI(["danger", "pr", "--dangerfile", "myDanger file.ts"])).toEqual([
    "danger",
    "runner",
    "--dangerfile",
    "myDanger file.ts",
  ])
})

it("Adds correct subprocess arguments", () => {
  expect(
    addSubprocessCallArguments(
      ["danger-swift"],
      ["danger", "danger-pr", "--process", "danger-swift", "--dangerfile", "File.swift"]
    )
  ).toEqual(["danger-swift", "runner", "danger-pr", "--process", "danger-swift", "--dangerfile", "File.swift"])
})

describe("npx danger-ts", () => {
  it("switches to the danger in the node_mods", () => {
    expect.assertions(1)
    // the code uses join which gives different results on windows, and I'm too lazy to add a specific test for that
    const isWindows = process.platform === "win32"
    if (!isWindows) {
      // eslint-disable-next-line jest/no-conditional-expect
      expect(
        dangerRunToRunnerCLI([
          "/Users/ortatherox/.nvm/versions/node/v14.5.0/bin/node",
          "/Users/ortatherox/.npm/_npx/23085/bin/danger-ts",
        ])
      ).toEqual([
        "/Users/ortatherox/.nvm/versions/node/v14.5.0/bin/node",
        "/Users/ortatherox/.npm/_npx/23085/lib/node_modules/danger-ts/node_modules/danger/distribution/commands/danger-runner.js",
      ])
    } else {
      console.warn("Unimplemented test on windows")
      // eslint-disable-next-line jest/no-conditional-expect
      expect(true).toBe(true)
    }
  })
})

describe("it can handle the command when running from pkg", () => {
  beforeAll(() => {
    process.pkg = {
      defaultEntrypoint: "Hello",
      entrypoint: "World",
    }
  })

  afterAll(() => {
    process.pkg = undefined
  })

  it("`./brew-distribution/danger /snapshot/danger-js/distribution/commands/danger-pr.js --dangerfile myDangerfile.ts`", () => {
    /**
     * The example of argv
     * [ '/Users/core/Documents/project/danger-js/brew-distribution/danger',
     *    '/snapshot/danger-js/distribution/commands/danger-pr.js',
     *    'https://bitbucket.org/foo/bar/pull-requests/381' ]
     */
    expect(
      dangerRunToRunnerCLI([
        "./brew-distribution/danger",
        "/snapshot/danger-js/distribution/commands/danger-pr.js",
        "--dangerfile",
        "myDangerfile.ts",
      ])
    ).toEqual(
      "./brew-distribution/danger /snapshot/danger-js/distribution/commands/danger-runner.js --dangerfile myDangerfile.ts".split(
        " "
      )
    )
  })
})

it("should properly replace `danger-runner` in a path that contains an additional `danger-pr` in it", () => {
  expect(
    dangerRunToRunnerCLI([
      "/Users/Mike.DiDomizio/.nvm/versions/node/v16.13.2/bin/node",
      "/Users/Mike.DiDomizio/projects/test/danger-project-setup/node_modules/danger/distribution/commands/danger-pr.js",
      "https://github.com/facebook/react/pull/11865",
    ])
  ).toEqual([
    "/Users/Mike.DiDomizio/.nvm/versions/node/v16.13.2/bin/node",
    "/Users/Mike.DiDomizio/projects/test/danger-project-setup/node_modules/danger/distribution/commands/danger-runner.js",
    "https://github.com/facebook/react/pull/11865",
  ])
})

it("should properly replace `danger-runner` in a path that contains an additional `danger-pr` in it even without the .js extension", () => {
  expect(
    dangerRunToRunnerCLI([
      "/Users/Mike.DiDomizio/.nvm/versions/node/v16.13.2/bin/node",
      "/Users/Mike.DiDomizio/projects/test/danger-project-setup/node_modules/danger/distribution/commands/danger-pr",
      "https://github.com/facebook/react/pull/11865",
    ])
  ).toEqual([
    "/Users/Mike.DiDomizio/.nvm/versions/node/v16.13.2/bin/node",
    "/Users/Mike.DiDomizio/projects/test/danger-project-setup/node_modules/danger/distribution/commands/danger-runner",
    "https://github.com/facebook/react/pull/11865",
  ])
})
