import dangerRunToRunnerCLI from "../dangerRunToRunnerCLI"

describe("it can handle the command", () => {
  it("`danger`", () => {
    expect(dangerRunToRunnerCLI(["danger"])).toEqual(["danger", "runner"])
  })

  it("`danger --dangerfile myDangerfile.ts`", () => {
    expect(dangerRunToRunnerCLI(["danger", "--dangerfile", "myDangerfile.ts"])).toEqual(
      "danger runner --dangerfile myDangerfile.ts".split(" ")
    )
  })

  it("`danger run`", () => {
    expect(dangerRunToRunnerCLI(["danger", "run"])).toEqual("danger runner".split(" "))
  })

  it("`danger run --dangerfile myDangerfile.ts`", () => {
    expect(dangerRunToRunnerCLI(["danger", "run", "--dangerfile", "myDangerfile.ts"])).toEqual(
      "danger runner --dangerfile myDangerfile.ts".split(" ")
    )
  })

  it("`node distribution/commands/danger-run.js`", () => {
    expect(dangerRunToRunnerCLI(["node", "distribution/commands/danger-run.js"])).toEqual(
      "node distribution/commands/danger-runner.js".split(" ")
    )
  })

  it("`node distribution/commands/danger-run.js --dangerfile myDangerfile.ts`", () => {
    expect(
      dangerRunToRunnerCLI(["node", "distribution/commands/danger-run.js", "--dangerfile", "myDangerfile.ts"])
    ).toEqual("node distribution/commands/danger-runner.js --dangerfile myDangerfile.ts".split(" "))
  })
})

it("`node distribution/commands/danger-run.js --dangerfile 'myDanger file.ts'`", () => {
  expect(
    dangerRunToRunnerCLI(["node", "distribution/commands/danger-run.js", "--dangerfile", "myDanger file.ts"])
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
