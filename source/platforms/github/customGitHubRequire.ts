import requireFromString from "require-from-string"

import cleanDangerfile from "../../runner/runners/utils/cleanDangerfile"
import transpiler from "../../runner/runners/utils/transpiler"
import { dirname, extname, posix } from "path"
import debug from "debug"
import { api } from "../../api/fetch"

// This prefix gets stamped on to reference strings when when grabbing via the GH API
export const dangerPrefix = "peril-downloaded-"

export interface RepresentationForURL {
  /** The path the the file aka folder/file.ts  */
  dangerfilePath: string
  /** The branch to find the dangerfile on  */
  branch: string
  /** An optional repo */
  repoSlug: string | undefined
  /** The original full string, with repo etc  */
  referenceString: string
}

/**
 * Takes a DangerfileReferenceString and lets you know where to find it globally
 * for strings like: artsy/peril-settings/settings.json@branch
 */
export const dangerRepresentationForPath = (value: string): RepresentationForURL => {
  const hasManySlashes = value.split("/").length > 2

  const [owner, repo, ...pathComponents] = hasManySlashes
    ? value.split("@")[0].split("/")
    : [undefined, undefined, ...value.split("@")[0].split("/")]

  return {
    branch: value.includes("@") ? value.split("@")[1] : "master",
    dangerfilePath: pathComponents.join("/"),
    repoSlug: owner ? `${owner}/${repo}` : undefined,
    referenceString: value,
  }
}

export async function getGitHubFileContentsFromLocation(
  token: string,
  location: RepresentationForURL,
  defaultRepo: string
) {
  return getGitHubFileContents(token, location.repoSlug || defaultRepo, location.dangerfilePath, location.branch)
}

/**
 * This function allows you to get the contents of a file from GitHub,
 * given a token.
 * Returns either the contents or an empty string.
 */
export async function getGitHubFileContents(
  token: string,
  repoSlug: string,
  path: string,
  ref: string | null,
  showError: boolean = true
) {
  const refString = ref ? `?ref=${ref}` : ""
  const containsBase = path.startsWith("http")
  const baseUrl = process.env["DANGER_GITHUB_API_BASE_URL"] || "https://api.github.com"
  const URLPath = `repos/${repoSlug}/contents/${path}${refString}`
  const url = containsBase ? URLPath : `${baseUrl}/${URLPath}`

  // I'm wary that this doesn't include github apps auth
  // in which case we need to do "bearer [token]"
  const res = await api(url, {
    headers: { Authorization: `bearer ${token}` },
  })

  const data = await res.json()
  if (res.ok) {
    const buffer = Buffer.from(data.content, "base64")
    return buffer.toString()
  } else {
    if (showError) {
      debug("res: " + res.url)
      debug("Getting GitHub file failed: " + JSON.stringify(data))
    }
    return ""
  }
}

// Setup a callback used to determine whether a specific `require` invocation
// needs to be overridden.
export const shouldUseGitHubOverride = (request: string, parent?: NodeModule): boolean => {
  // Is it a from a file we're handling, and is it relative?
  if (parent?.filename.startsWith(dangerPrefix) && request.startsWith(".")) {
    return true
  }
  // Basically any import that's not a relative import from a Dangerfile
  return false
}

// We want to handle relative imports inside a Dangerfile, this custom version of the require func
// returns a Promise instead of the normal object, and so you would use `await require("./thing")`
// Which TypeScript handles just as you'd expect

export const customGitHubResolveRequest = (token: string) => async (request: string, parent: { filename: string }) => {
  const prefixLessParent = parent.filename.replace(dangerPrefix, "")
  debug(`Grabbing relative import "${request}" to ${prefixLessParent}.`)

  const dangerRep = dangerRepresentationForPath(prefixLessParent)
  // This is the un-prefixed local path for the module requested`./thing`
  const localPath = posix.resolve(dirname(dangerRep.dangerfilePath), request).replace(posix.resolve(""), "")

  // It's possible that you're jumping between a *.ts and a *.js - it's weird, sure, but I'll allow it
  const extensions = extname(prefixLessParent) === ".ts" ? [".ts", ".js"] : [".js", ".ts"]

  for (const ext of extensions) {
    // Make a new reference string by resolving the old path and appending the extension
    const newReferenceString = prefixLessParent.replace(dangerRep.dangerfilePath, localPath) + ext
    const newRep = dangerRepresentationForPath(newReferenceString)

    // Not supported right now
    if (!newRep.repoSlug) {
      throw new Error("Relative imports don't work without a repo slug in the dangerfile reference.")
    }

    // Try grabbing the file from github
    const dangerfileContent = await getGitHubFileContentsFromLocation(token, newRep, newRep.repoSlug)
    if (dangerfileContent) {
      // We want to ensure we don't lose the prefix for any potential imports in there
      const newPerilFileReference = `${dangerPrefix}${newReferenceString}`
      // Remove the danger import
      const newDangerfile = cleanDangerfile(dangerfileContent)
      // Cool, transpile it into something we can run
      const transpiled = transpiler(newDangerfile, newPerilFileReference)
      return requireFromString(transpiled, newPerilFileReference)
    }
  }

  // User error in the path basically
  throw new Error(
    `Could not find '${request}' as a relative import from ${prefixLessParent}. Does ${localPath} exist in the repo?`
  )
}
