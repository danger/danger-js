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

export const resultsToCheck = (results: DangerResults, options: ExecutorOptions, pr: GitHubPRDSL): CheckOptions => {
  const repo = pr.base.repo
  const hasFails = results.fails.length > 0
  const hasWarnings = results.warnings.length > 0

  const mainResults = regularResults(results)
  const annotationResults = inlineResults(results)

  const mainBody = githubResultsTemplate(options.dangerID, mainResults)

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
      title: "Title, figure out what to put here",
      summary: mainBody,
      annotations: inlineResultsToAnnotations(annotationResults, options),
    },
  }
}

const inlineResultsToAnnotations = (results: DangerResults, options: ExecutorOptions): CheckAnnotation[] => {
  // Basically coalesces violations based on file and line
  const inlineResults = resultsIntoInlineResults(results)

  return inlineResults.map(perFileResults => ({
    filename: perFileResults.file,
    blob_href: "", //TODO, this will be trick, today we should do the dumbest thing, but maybe in the future this can use the tree API to get the blobs for many files at once
    warning_level: warningLevelForInlineResults(perFileResults),
    message: githubResultsInlineTemplate(
      options.dangerID,
      inlineResultsIntoResults(perFileResults),
      perFileResults.file,
      perFileResults.line
    ),
    start_line: perFileResults.line || 0,
    end_line: perFileResults.line || 0,
  }))
}

const warningLevelForInlineResults = (results: DangerInlineResults): "notice" | "warning" | "failure" => {
  const hasFails = results.fails.length > 0
  const hasWarnings = results.warnings.length > 0
  return hasFails ? "failure" : hasWarnings ? "warning" : "notice"
}
