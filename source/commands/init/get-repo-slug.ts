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

    const config: Record<string, any> = {}

    if (parsedConfig.remote) {
      for (const remoteName in parsedConfig.remote) {
        config[`remote "${remoteName}"`] = parsedConfig.remote[remoteName]
      }
    }

    const possibleRemotes = [config['remote "upstream"'], config['remote "origin"']].filter((f) => f)
    if (possibleRemotes.length === 0) {
      return null
    }

    const ghData = possibleRemotes.map((r) => parseGithubURL(r.url))
    return ghData.length ? ghData[0].repo : undefined
  } catch (error) {
    console.error("Error reading git config:", error)
    return null
  }
}
