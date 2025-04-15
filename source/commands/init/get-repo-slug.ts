import fs from "fs"
import path from "path"
import ini from "ini"
import parseGithubURL from "parse-github-url"

export const getRepoSlug = () => {
  try {
    const gitConfigPath = path.join(process.cwd(), ".git", "config")

    if (!fs.existsSync(gitConfigPath)) {
      return null
    }

    const configContent = fs.readFileSync(gitConfigPath, "utf8")
    const parsedConfig = ini.parse(configContent)
    const remotes: Record<string, any> = {}

    for (const key in parsedConfig) {
      if (key.startsWith('remote "')) {
        const remoteName = key.substring(8, key.length - 1)
        remotes[remoteName] = parsedConfig[key]
      }
    }

    const possibleRemoteNames = ["upstream", "origin"]
    const possibleRemotes = possibleRemoteNames.map((name) => remotes[name]).filter((remote) => remote && remote.url)

    if (possibleRemotes.length === 0) {
      return null
    }
    const ghData = possibleRemotes.map((r) => parseGithubURL(r.url))
    return ghData.length && ghData[0] ? ghData[0].repo : undefined
  } catch (error) {
    console.error("Error reading git config:", error)
    return null
  }
}
