import { EventEmitter } from "events"
import { spawn } from "child_process"
import { localGetDiff } from "../localGetDiff"

jest.mock("child_process", () => ({ spawn: jest.fn() }))

it.each([false, true])("passes separate prefix arguments to git (staging: %s)", async (staging) => {
  const child = new EventEmitter() as any
  child.stdout = new EventEmitter()
  child.stderr = new EventEmitter()
  ;(spawn as jest.Mock).mockReturnValue(child)

  const result = localGetDiff("main", "HEAD", staging)

  expect(spawn).toHaveBeenCalledWith(
    "git",
    ["diff", "--no-color", "--src-prefix=a/", "--dst-prefix=b/", staging ? "--staged" : "main...HEAD"],
    { env: process.env }
  )
  child.stdout.emit("data", "diff contents")
  child.emit("close", 0)
  await expect(result).resolves.toBe("diff contents")
})
