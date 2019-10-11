import parseGitConfig from "parse-git-config"
import parseGithubURL from "parse-github-url"

export const getRepoSlug = () => {
  const config = parseGitConfig.sync()
  const possibleRemotes = [config['remote "upstream"'], config['remote "origin"']].filter(f => f)
  if (possibleRemotes.length === 0) {
    return null
  }

  const ghData = possibleRemotes.map(r => parseGithubURL(r.url))
  return ghData.length ? ghData[0].repo : undefined
}

export const getRepoInfo = () => {
  const config = parseGitConfig.sync()
  const possibleRemotes = [config['remote "upstream"'], config['remote "origin"']].filter(f => f)
  if (possibleRemotes.length === 0) {
    return "unknown"
  }

  const repoData = possibleRemotes.map(r => inspectURL(r.url))
  return repoData.length ? repoData[0] : "unknown"
}

const inspectURL = (url: string) => {
  if (url.includes("github")) {
    return "github"
  } else if (url.includes("dev.azure.com") || url.includes(".visualstudio.com")) {
    return "azureDevops"
  } else if (url.includes("bitbucket.org")) {
    return "bitbucket"
  } else {
    return "unknown"
  }
}
