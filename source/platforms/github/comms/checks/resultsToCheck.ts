import {
  DangerResults,
  regularResults,
  inlineResults,
  resultsIntoInlineResults,
  inlineResultsIntoResults,
  DangerInlineResults,
} from "../../../../dsl/DangerResults"
import { GitHubPRDSL } from "../../../../dsl/GitHubDSL"
import { ExecutorOptions } from "../../../../runner/Executor"
import {
  template as githubResultsTemplate,
  inlineTemplate as githubResultsInlineTemplate,
} from "../../../../runner/templates/githubIssueTemplate"
import GitHubNodeAPI from "@octokit/rest"
import { debug } from "../../../../debug"

const d = debug("GitHub::ResultsToCheck")

export interface CheckImages {
  alt: string
  image_url: string
  caption: string
}

export interface CheckAnnotation {
  filename: string
  blob_href: string
  warning_level: "notice" | "warning" | "failure"
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
  api: GitHubNodeAPI
): Promise<CheckOptions> => {
  const repo = pr.base.repo
  const hasFails = results.fails.length > 0
  const hasWarnings = results.warnings.length > 0

  const mainResults = regularResults(results)
  const annotationResults = inlineResults(results)

  const mainBody = githubResultsTemplate(options.dangerID, mainResults)

  const getBlobUrlForPath = async (path: string) => {
    try {
      const { data } = await api.repos.getContent({ repo: pr.head.repo.name, owner: pr.head.repo.owner.login, path })
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
    name: "Danger",
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
  options: ExecutorOptions,
  getBlobUrlForPath: any
): Promise<CheckAnnotation[]> => {
  // Basically coalesces violations based on file and line
  const inlineResults = resultsIntoInlineResults(results)

  // Make a list of annotations, because we use async it's
  // a bit of faffing
  const annotations: CheckAnnotation[] = []

  for (const perFileResults of inlineResults) {
    const annotation: CheckAnnotation = {
      filename: perFileResults.file,
      blob_href: await getBlobUrlForPath(perFileResults.file),
      warning_level: warningLevelForInlineResults(perFileResults),
      message: githubResultsInlineTemplate(
        options.dangerID,
        inlineResultsIntoResults(perFileResults),
        perFileResults.file,
        perFileResults.line
      ),
      start_line: perFileResults.line || 0,
      end_line: perFileResults.line || 0,
    }

    annotations.push(annotation)
  }

  return annotations
}

const warningLevelForInlineResults = (results: DangerInlineResults): "notice" | "warning" | "failure" => {
  const hasFails = results.fails.length > 0
  const hasWarnings = results.warnings.length > 0
  return hasFails ? "failure" : hasWarnings ? "warning" : "notice"
}
