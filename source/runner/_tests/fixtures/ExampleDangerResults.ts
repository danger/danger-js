import { DangerResults } from "../../../dsl/DangerResults"

export const emptyResults: DangerResults = {
  scheduled: [],
  fails: [],
  warnings: [],
  messages: [],
  markdowns: []
}

export const failsResultsWithoutMessages: DangerResults = {
  scheduled: [],
  fails: [{}, {}],
  warnings: [],
  messages: [],
  markdowns: []
}

export const warnResults: DangerResults = {
  scheduled: [],
  fails: [],
  warnings: [{ message: "Warning message" }],
  messages: [],
  markdowns: []
}

export const failsResults: DangerResults = {
  scheduled: [],
  fails: [{ message: "Failing message" }],
  warnings: [],
  messages: [],
  markdowns: []
}

export const summaryResults: DangerResults = {
  scheduled: [],
  fails: [{ message: "Failing message Failing message" }],
  warnings: [{ message: "Warning message Warning message" }],
  messages: [{ message: "message" }],
  markdowns: ["markdown"],
}

export const asyncResults: DangerResults = {
  scheduled: [async () => 1],
  fails: [],
  warnings: [],
  messages: [],
  markdowns: [],
}
