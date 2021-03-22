import gitlog from "gitlog"

import { localGetCommits } from "../localGetCommits"

const hash = "hash"
const abbrevParentHashes = "abbrevParentHashes"
const treeHash = "treeHash"
const authorName = "authorName"
const authorEmail = "authorEmail"
const authorDate = "authorDate"
const committerName = "committerName"
const committerEmail = "committerEmail"
const committerDate = "committerDate"
const subject = "subject"

const gitLogCommitMock = {
  hash,
  abbrevParentHashes,
  treeHash,
  authorName,
  authorEmail,
  authorDate,
  committerName,
  committerEmail,
  committerDate,
  subject,
}

jest.mock("gitlog", () => ({
  __esModule: true,
  default: jest.fn(() => [gitLogCommitMock]),
}))

it("generates a JSON-like commit message", () => {
  const base = "base-branch"
  const head = "head-branch"

  const result = localGetCommits(base, head)

  expect(gitlog).toHaveBeenCalledWith({
    repo: expect.any(String),
    branch: `${base}...${head}`,
    fields: expect.any(Array),
  })

  expect(result).toEqual([
    {
      sha: hash,
      author: {
        name: authorName,
        email: authorEmail,
        date: authorDate,
      },
      committer: {
        name: committerName,
        email: committerEmail,
        date: committerDate,
      },
      message: subject,
      tree: treeHash,
      url: expect.stringContaining(hash),
    },
  ])
})
