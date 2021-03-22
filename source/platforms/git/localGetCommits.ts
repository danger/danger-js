import gitlog, { GitlogOptions } from "gitlog"

import { GitCommit } from "../../dsl/Commit"

export const localGetCommits = (base: string, head: string) => {
  const options: GitlogOptions<
    | "hash"
    | "abbrevParentHashes"
    | "treeHash"
    | "authorName"
    | "authorEmail"
    | "authorDate"
    | "committerName"
    | "committerEmail"
    | "committerDate"
    | "subject"
  > = {
    repo: process.cwd(),
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
    ],
  }

  const commits: GitCommit[] = gitlog(options).map(commit => ({
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
