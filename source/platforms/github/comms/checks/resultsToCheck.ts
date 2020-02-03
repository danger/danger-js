import { DangerResults, regularResults, inlineResults, resultsIntoInlineResults } from "../../../../dsl/DangerResults"
import { GitHubPRDSL } from "../../../../dsl/GitHubDSL"
import { ExecutorOptions } from "../../../../runner/Executor"
import { template as githubResultsTemplate } from "../../../../runner/templates/githubIssueTemplate"
import { Octokit as GitHubNodeAPI } from "@octokit/rest"
import { debug } from "../../../../debug"

const d = debug("GitHub::ResultsToCheck")

export interface CheckImages {
  alt: string
  image_url: string
  caption: string
}

export interface CheckAnnotation {
  path: string
  blob_href: string
  annotation_level: "notice" | "warning" | "failure"
  message: string
  start_line: number
  end_line: number

  title?: string
  raw_details?: string
}

export interface CheckOptions {
  name: string
  owner: string
  repo: string
  head_branch: string
  head_sha: string

  status: "queued" | "in_progress" | "completed"
  completed_at: string // ISO8601
  conclusion: "success" | "failure" | "neutral" | "cancelled" | "timed_out" | "action_required"
  /** "action_required" in a conclusion needs a details URL, but maybe this could be the CI build? */
  details_url?: string

  output: {
    title: string
    summary: string
    text?: string
    annotations: CheckAnnotation[]
    images?: CheckImages[]
  }
}

export const resultsToCheck = async (
  results: DangerResults,
  options: ExecutorOptions,
  pr: GitHubPRDSL,
  api: GitHubNodeAPI,
  ciCommitHash?: string,
  name: string = "Danger"
): Promise<CheckOptions> => {
  const repo = pr.base.repo
  const hasFails = results.fails.length > 0
  const hasWarnings = results.warnings.length > 0

  const mainResults = regularResults(results)
  const annotationResults = inlineResults(results)

  const commitID = ciCommitHash || pr.head.sha

  const mainBody = githubResultsTemplate(options.dangerID, mainResults, commitID)

  const getBlobUrlForPath = async (path: string) => {
    try {
      // response of getContents() can be one of 4 things. We are interested in file responses only
      // https://developer.github.com/v3/repos/contents/#get-contents
      const { data } = await api.repos.getContents({ repo: pr.head.repo.name, owner: pr.head.repo.owner.login, path })
      if (Array.isArray(data)) {
        console.error(`Path "${path}" is a folder - ignoring`)
        return ""
      }
      d("Got content data for: ", path)
      // https://developer.github.com/v3/checks/runs/#example-of-completed-conclusion
      // e.g.  "blob_href": "http://github.com/octocat/Hello-World/blob/837db83be4137ca555d9a5598d0a1ea2987ecfee/README.md",
      return `${pr.head.repo.html_url}/blob/${data.sha}/${data.path}`
    } catch (error) {
      console.error(`An error was raised in getting the blob path for ${path} - ${error}`)
      return ""
    }
  }

  d("Generating inline annotations")
  const annotations = await inlineResultsToAnnotations(annotationResults, options, getBlobUrlForPath)
  const isEmpty =
    !results.fails.length && !results.markdowns.length && !results.warnings.length && !results.messages.length

  return {
    name,
    status: "completed",
    completed_at: new Date().toISOString(),

    // Repo Metadata
    owner: repo.owner.login,
    repo: repo.name,
    head_branch: pr.head.ref,
    head_sha: pr.head.sha,

    // fail if fails, neutral is warnings, else success
    conclusion: hasFails ? "failure" : hasWarnings ? "neutral" : "success",

    // The rest of the vars, need to see this in prod to really make a
    // nuanced take on what it should look like
    output: {
      title: isEmpty ? "All good" : "",
      summary: mainBody,
      annotations,
    },
  }
}

const inlineResultsToAnnotations = async (
  results: DangerResults,
  _options: ExecutorOptions,
  getBlobUrlForPath: any
): Promise<CheckAnnotation[]> => {
  // Basically coalesces violations based on file and line
  const inlineResults = resultsIntoInlineResults(results)

  // Make a list of annotations, because we use async it's
  // a bit of faffing
  const annotations: CheckAnnotation[] = []

  for (const perFileResults of inlineResults) {
    const fileAnnotation = {
      path: perFileResults.file,
      blob_href: await getBlobUrlForPath(perFileResults.file),
      start_line: perFileResults.line || 0,
      end_line: perFileResults.line || 0,
    }

    perFileResults.fails.forEach(message => {
      annotations.push({
        ...fileAnnotation,
        annotation_level: "failure",
        message: message,
      })
    })

    perFileResults.warnings.forEach(message => {
      annotations.push({
        ...fileAnnotation,
        annotation_level: "warning",
        message: message,
      })
    })

    perFileResults.messages.forEach(message => {
      annotations.push({
        ...fileAnnotation,
        annotation_level: "notice",
        message: message,
      })
    })

    perFileResults.markdowns.forEach(message => {
      annotations.push({
        ...fileAnnotation,
        annotation_level: "notice",
        message: message,
      })
    })
  }

  return annotations
}
