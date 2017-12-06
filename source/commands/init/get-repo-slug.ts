import * as parseGitConfig from "parse-git-config"
import * as parseGithubURL from "parse-github-url"

export const getRepoSlug = () => {
  const config = parseGitConfig.sync()
  const possibleRemotes = [config['remote "upstream"'], config['remote "origin"']].filter(f => f)
  if (possibleRemotes.length === 0) {
    return null
  }

  const ghData = possibleRemotes.map(r => parseGithubURL(r.url))[0]
  return ghData.repo
}
