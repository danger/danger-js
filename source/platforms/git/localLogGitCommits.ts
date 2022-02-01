import { execFileSync } from "child_process"

const delimiter = "\t"
const fieldMap = {
  hash: "%H",
  treeHash: "%T",
  abbrevParentHashes: "%P",
  authorName: "%an",
  authorEmail: "%ae",
  authorDate: "%ai",
  committerName: "%cn",
  committerEmail: "%ce",
  committerDate: "%cd",
  subject: "%s",
}

export type GitLogOptions = {
  number: number
  branch: string
  fields: ReadonlyArray<Partial<keyof typeof fieldMap>>
}

export type GitLogCommit = {
  hash: string
  treeHash: string
  abbrevParentHashes: string
  authorName: string
  authorEmail: string
  authorDate: string
  committerName: string
  committerEmail: string
  committerDate: string
  subject: string
}

const createCommandArguments = (options: GitLogOptions) => {
  // Start constructing command
  let command: string[] = ["log", "-l0"]

  command.push(`-n ${options.number}`)

  // Start of custom format
  let prettyArgument = "--pretty=@begin@"

  // Iterating through the fields and adding them to the custom format
  if (options.fields) {
    options.fields.forEach((field) => {
      prettyArgument += delimiter + fieldMap[field]
    })
  }

  // Close custom format
  prettyArgument += "@end@"
  command.push(prettyArgument)

  // Append branch (revision range) if specified
  if (options.branch) {
    command.push(options.branch)
  }

  return command
}

const parseCommits = (commits: readonly string[], fields: readonly string[]) =>
  commits.map((rawCommit) => {
    const parts = rawCommit.split("@end@")
    const commit = parts[0].split(delimiter)

    // Remove the first empty char from the array
    commit.shift()

    const parsed = {}

    commit.forEach((commitField, index) => {
      if (!fields[index]) {
        return
      }

      parsed[fields[index]] = commitField
    })

    return parsed as GitLogCommit
  })

export const logGitCommits = (options: GitLogOptions) => {
  const commandArguments = createCommandArguments(options)

  const stdout = execFileSync("git", commandArguments).toString()

  const commits = stdout.split("@begin@")

  if (commits[0] === "") {
    commits.shift()
  }

  return parseCommits(commits, options.fields)
}
