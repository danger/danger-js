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

export const inlineMultipleWarnResults: DangerResults = {
  messages: [],
  warnings: [
    { message: "Test message", file: "File.swift", line: 10 },
    { message: "Test message", file: "File.swift", line: 11 },
    { message: "Test message", file: "File2.swift", line: 10 },
  ],
  fails: [],
  markdowns: [],
}

export const inlineMultipleWarnResults2: DangerResults = {
  messages: [],
  warnings: [
    { message: "Test message2", file: "File.swift", line: 10 },
    { message: "Test message2", file: "File.swift", line: 11 },
    { message: "Test message2", file: "File2.swift", line: 10 },
  ],
  fails: [],
  markdowns: [],
}

export const inlineFailResults: DangerResults = {
  messages: [],
  warnings: [],
  fails: [{ message: "Test message", file: "File.swift", line: 10 }],
  markdowns: [],
}

export const inlineMessageResults: DangerResults = {
  messages: [{ message: "Test message", file: "File1.swift", line: 10 }],
  warnings: [],
  fails: [],
  markdowns: [],
}

export const inlineCustomIconMessagesResults: DangerResults = {
  fails: [],
  warnings: [],
  messages: [{ message: "Message with custom icon", icon: "📝", file: "File.swift", line: 10 }],
  markdowns: [],
}

export const inlineRegularResults: DangerResults = {
  messages: [],
  warnings: [{ message: "Test message", file: "File.swift", line: 10 }, { message: "Warning message" }],
  fails: [],
  markdowns: [],
}

export const inlineRegularResultsForTheSameLine: DangerResults = {
  messages: [
    { message: "Test message", file: "File.swift", line: 10 },
    { message: "Warning message", file: "File.swift", line: 10 },
  ],
  warnings: [
    { message: "Test message", file: "File.swift", line: 10 },
    { message: "Warning message", file: "File.swift", line: 10 },
  ],
  fails: [
    { message: "Test message", file: "File.swift", line: 10 },
    { message: "Warning message", file: "File.swift", line: 10 },
  ],
  markdowns: [
    { message: "Test message", file: "File.swift", line: 10 },
    { message: "Warning message", file: "File.swift", line: 10 },
  ],
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

export const customIconMessagesResults: DangerResults = {
  fails: [],
  warnings: [],
  messages: [{ message: "Message with custom icon", icon: "📝" }],
  markdowns: [],
}

export const multipleMessagesResults: DangerResults = {
  fails: [],
  warnings: [],
  messages: [
    { message: "Message with custom icon", icon: "📝" },
    { message: "Message with custom icon2", icon: "🔔" },
    { message: "Test message" }
  ],
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

export const resultsWithCustomMeta: DangerResults = {
  messages: [],
  warnings: [{ message: "Test message", file: "File.swift", line: 10 }],
  fails: [],
  markdowns: [],
  meta: {
    runtimeName: "DangerMajick",
    runtimeHref: "https://danger.magic",
  },
}

export const multipleSummaryResults: DangerResults = {
  fails: [{ message: "Failing message Failing message" }, { message: "Failing message 2, This is Failing message" }],
  warnings: [{ message: "Warning message Warning message" }, { message: "Warning message" }],
  messages: [{ message: "message" }, { message: "message 2" }, { message: "message 3" }],
  markdowns: [{ message: "markdown" }],
}
