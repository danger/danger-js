import {
  resultsIntoInlineResults,
  inlineResultsIntoResults,
  mergeResults,
  emptyDangerResults,
  inlineResults,
  regularResults,
} from "../DangerResults"
import {
  singleViolationSingleFileResults,
  multipleViolationSingleFileResults,
  multipleViolationsMultipleFilesResults,
  singleViolationsInlineResults,
  multipleViolationsInlineResults,
  regularAndInlineViolationsResults,
  emptyDangerInlineResults,
} from "./fixtures/ExampleDangerResults"

describe("DangerResults into DangerInlineResults", () => {
  it("transforms empty results into empty inlineResults", () => {
    let results = resultsIntoInlineResults(emptyDangerResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms single-violation results into one inlineResults", () => {
    let results = resultsIntoInlineResults(singleViolationSingleFileResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms multiple-violation results into one inlineResults", () => {
    let results = resultsIntoInlineResults(multipleViolationSingleFileResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms multiple-violation results into multiple inlineResults within one file", () => {
    let results = resultsIntoInlineResults(multipleViolationsMultipleFilesResults)

    expect(results).toMatchSnapshot()
  })
})

describe("DangerInlineResults into DangerResults", () => {
  it("transforms empty inlineResults into results", () => {
    let results = inlineResultsIntoResults(emptyDangerInlineResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms single-violation inlineResults into results", () => {
    let results = inlineResultsIntoResults(singleViolationsInlineResults)

    expect(results).toMatchSnapshot()
  })

  it("transforms multiple-violation inlineResults into results", () => {
    let results = inlineResultsIntoResults(multipleViolationsInlineResults)

    expect(results).toMatchSnapshot()
  })
})

describe("DangerResults operations", () => {
  it("merges two results correcly", () => {
    let results = mergeResults(singleViolationSingleFileResults, multipleViolationSingleFileResults)

    expect(results).toMatchSnapshot()
  })

  it("filters results to get only inline violations", () => {
    let results = inlineResults(regularAndInlineViolationsResults)

    expect(results).toMatchSnapshot()
  })

  it("filters results to get only regular violations", () => {
    let results = regularResults(regularAndInlineViolationsResults)

    expect(results).toMatchSnapshot()
  })
})
