import { DangerResults } from "../../../dsl/DangerResults"

export const emptyResults: DangerResults = {
  fails: [],
  warnings: [],
  messages: [],
  markdowns: [],
}

export const failsResultsWithoutMessages: DangerResults = {
  fails: [{} as any, {} as any],
  warnings: [],
  messages: [],
  markdowns: [],
}

export const warnResults: DangerResults = {
  fails: [],
  warnings: [{ message: "Warning message" }],
  messages: [],
  markdowns: [],
}

export const inlineWarnResults: DangerResults = {
  messages: [],
  warnings: [{ message: "Test message", file: "File.swift", line: 10 }],
  fails: [],
  markdowns: [],
}

export const failsResults: DangerResults = {
  fails: [{ message: "Failing message" }],
  warnings: [],
  messages: [],
  markdowns: [],
}

export const messagesResults: DangerResults = {
  fails: [],
  warnings: [],
  messages: [{ message: "Message" }],
  markdowns: [],
}

export const markdownResults: DangerResults = {
  fails: [],
  warnings: [],
  messages: [],
  markdowns: [{ message: "### Short Markdown Message1" }, { message: "### Short Markdown Message2" }],
}

export const summaryResults: DangerResults = {
  fails: [{ message: "Failing message Failing message" }],
  warnings: [{ message: "Warning message Warning message" }],
  messages: [{ message: "message" }],
  markdowns: [{ message: "markdown" }],
}

export const asyncResults: DangerResults = {
  fails: [],
  warnings: [],
  messages: [],
  markdowns: [],
}
