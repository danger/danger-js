import { localGetCommits } from "../localGetCommits"
import { logGitCommits } from "../localLogGitCommits"

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

jest.mock("../localLogGitCommits", () => ({
  __esModule: true,
  logGitCommits: jest.fn(() => [gitLogCommitMock]),
}))

it("generates a JSON-like commit message", () => {
  const base = "base-branch"
  const head = "head-branch"

  const result = localGetCommits(base, head)

  expect(logGitCommits).toHaveBeenCalledWith({
    number: expect.any(Number),
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
