import { logGitCommits } from "./localLogGitCommits"
import { GitCommit } from "../../dsl/Commit"

export const localGetCommits = (base: string, head: string) => {
  const options = {
    number: 100,
    branch: `${base}...${head}`,
    fields: [
      "hash" as "hash",
      "abbrevParentHashes" as "abbrevParentHashes",
      "treeHash" as "treeHash",
      "authorName" as "authorName",
      "authorEmail" as "authorEmail",
      "authorDate" as "authorDate",
      "committerName" as "committerName",
      "committerEmail" as "committerEmail",
      "committerDate" as "committerDate",
      "subject" as "subject",
    ],
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
