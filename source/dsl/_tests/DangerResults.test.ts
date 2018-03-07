import {
  resultsIntoInlineResults,
  inlineResultsIntoResults,
  mergeResults,
  emptyDangerResults,
  inlineResults,
  regularResults,
  sortInlineResults,
} from "../DangerResults"
import {
  singleViolationSingleFileResults,
  multipleViolationSingleFileResults,
  multipleViolationsMultipleFilesResults,
  singleViolationsInlineResults,
  multipleViolationsInlineResults,
  regularAndInlineViolationsResults,
  emptyDangerInlineResults,
  unsortedInlineResults,
} from "./fixtures/ExampleDangerResults"

describe("DangerResults into DangerInlineResults", () => {
  it("transforms empty results into empty inlineResults", () => {
    const results = resultsIntoInlineResults(emptyDangerResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms single-violation results into one inlineResults", () => {
    const results = resultsIntoInlineResults(singleViolationSingleFileResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms multiple-violation results into one inlineResults", () => {
    const results = resultsIntoInlineResults(multipleViolationSingleFileResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms multiple-violation results into multiple inlineResults within one file", () => {
    const results = resultsIntoInlineResults(multipleViolationsMultipleFilesResults)

    expect(results).toMatchSnapshot()
  })
})

describe("DangerInlineResults into DangerResults", () => {
  it("transforms empty inlineResults into results", () => {
    const results = inlineResultsIntoResults(emptyDangerInlineResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms single-violation inlineResults into results", () => {
    const results = inlineResultsIntoResults(singleViolationsInlineResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms multiple-violation inlineResults into results", () => {
    const results = inlineResultsIntoResults(multipleViolationsInlineResults)

    expect(results).toMatchSnapshot()
  })
})

describe("DangerResults operations", () => {
  it("merges two results correcly", () => {
    const results = mergeResults(singleViolationSingleFileResults, multipleViolationSingleFileResults)

    expect(results).toMatchSnapshot()
  })

  it("filters results to get only inline violations", () => {
    const results = inlineResults(regularAndInlineViolationsResults)

    expect(results).toMatchSnapshot()
  })

  it("filters results to get only regular violations", () => {
    const results = regularResults(regularAndInlineViolationsResults)

    expect(results).toMatchSnapshot()
  })

  it("sorts inline results", () => {
    const results = sortInlineResults(unsortedInlineResults)

    expect(results).toMatchSnapshot()
  })
})
