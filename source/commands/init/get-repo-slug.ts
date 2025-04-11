import { simpleGit } from "simple-git"
import parseGithubURL from "parse-github-url"

export const getRepoSlug: () => Promise<string> = async () => {
  const git = simpleGit()
  const remotes = await git.getRemotes(true)
  const possibleRemotes = remotes.filter((remote) => remote.name === "upstream" || remote.name === "origin")
  if (possibleRemotes.length === 0) {
    return null
  }

  const ghData = possibleRemotes.map((r) => parseGithubURL(r.refs.fetch))
  return ghData.length ? ghData[0].repo : undefined
}
