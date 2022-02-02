import { logGitCommits } from "./localLogGitCommits"
import { GitCommit } from "../../dsl/Commit"

export const localGetCommits = (base: string, head: string) => {
  const options = {
    number: 100,
    branch: `${base}...${head}`,
    fields: [
      "hash",
      "abbrevParentHashes",
      "treeHash",
      "authorName",
      "authorEmail",
      "authorDate",
      "committerName",
      "committerEmail",
      "committerDate",
      "subject",
    ] as const,
  }

  const commits: GitCommit[] = logGitCommits(options).map(commit => ({
    sha: commit.hash,
    author: {
      name: commit.authorName,
      email: commit.authorEmail,
      date: commit.authorDate,
    },
    committer: {
      name: commit.committerName,
      email: commit.committerEmail,
      date: commit.committerDate,
    },
    message: commit.subject,
    tree: commit.treeHash,
    url: "fake.danger.systems/" + commit.hash,
  }))

  return commits
}
