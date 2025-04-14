import fs from "fs"
import path from "path"
import ini from "ini"
import parseGithubURL from "parse-github-url"

export const getRepoSlug = () => {
  try {
    // Find .git/config in the current directory or parent directories
    const gitConfigPath = path.join(process.cwd(), ".git", "config")

    if (!fs.existsSync(gitConfigPath)) {
      return null
    }

    // Read and parse the git config file
    const configContent = fs.readFileSync(gitConfigPath, "utf8")

    // Parse the git config and transform to match parse-git-config's output format
    const parsedConfig = ini.parse(configContent)

    // Transform the ini output to match parse-git-config's structure
    const config: Record<string, any> = {}

    // Handle the remotes section specifically
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
