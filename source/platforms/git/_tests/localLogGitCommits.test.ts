import { execFileSync } from "child_process"

import { logGitCommits } from "../localLogGitCommits"

const COMMAND_OUTPUT = ""

jest.mock("child_process", () => ({
  __esModule: true,
  execFileSync: jest.fn(() => COMMAND_OUTPUT),
}))

it("get git commits from the 'git log' command", () => {
  const options = {
    number: 10,
    branch: "test_branch",
    fields: ["hash", "subject"] as const,
  }

  const result = logGitCommits(options)

  expect(execFileSync).toHaveBeenCalledWith("git", [
    "log",
    "-l0",
    `-n ${options.number}`,
    "--pretty=@begin@" + "\t%H\t%s" + "@end@",
    options.branch,
  ])

  expect(result).toEqual([])
})
