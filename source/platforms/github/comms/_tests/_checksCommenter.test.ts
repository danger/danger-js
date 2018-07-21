import { tweetSizedResultsFromResults } from "../checksCommenter"
import {
  failsResultsWithoutMessages,
  inlineMultipleWarnResults,
  markdownResults,
  summaryResults,
} from "../../../../runner/_tests/fixtures/ExampleDangerResults"

const checksResults = { html_url: "https://gh.com/a" }

it("handles fails", () => {
  const newResults = tweetSizedResultsFromResults(failsResultsWithoutMessages, checksResults)
  expect(newResults.markdowns[0].message).toMatchInlineSnapshot(
    `"Danger run resulted in 2 fails - to find out more, see the [checks page](https://gh.com/a)."`
  )
})

it("ignores inlines", () => {
  const newResults = tweetSizedResultsFromResults(failsResultsWithoutMessages, checksResults)
  expect(newResults.markdowns[0].message).toMatchInlineSnapshot(
    `"Danger run resulted in 2 fails - to find out more, see the [checks page](https://gh.com/a)."`
  )
})

it("deals with warnings", () => {
  const newResults = tweetSizedResultsFromResults(inlineMultipleWarnResults, checksResults)
  expect(newResults.markdowns[0].message).toMatchInlineSnapshot(
    `"Danger run resulted in 3 warnings - to find out more, see the [checks page](https://gh.com/a)."`
  )
})

it("deals with markdowns", () => {
  const newResults = tweetSizedResultsFromResults(markdownResults, checksResults)
  expect(newResults.markdowns[0].message).toMatchInlineSnapshot(
    `"Danger run resulted in 2 markdowns - to find out more, see the [checks page](https://gh.com/a)."`
  )
})

it("handles singular results", () => {
  const newResults = tweetSizedResultsFromResults(summaryResults, checksResults)
  expect(newResults.markdowns[0].message).toMatchInlineSnapshot(
    `"Danger run resulted in 1 fail, 1 warning, 1 message and 1 markdown - to find out more, see the [checks page](https://gh.com/a)."`
  )
})
