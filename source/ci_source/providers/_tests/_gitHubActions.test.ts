import { GitHubActions } from "../GitHubActions"

const pullRequestEvent = {
  pull_request: {
    number: "2",
    base: {
      repo: {
        full_name: "danger/danger-js",
      },
    },
  },
}

const issueEvent = {
  issue: {
    number: "2",
  },
  repository: {
    full_name: "danger/danger-js",
  },
}

describe("use event DSL", () => {
  it("returns false when event.json contains pull_request data", () => {
    const ci = new GitHubActions({}, pullRequestEvent)
    expect(ci.useEventDSL).toBeFalsy()
  })

  it("returns false when event.json contains issue data", () => {
    const ci = new GitHubActions({}, issueEvent)
    expect(ci.useEventDSL).toBeFalsy()
  })

  it("returns true when event.json doesn't contain issue or pull_request data", () => {
    const ci = new GitHubActions({}, {})
    expect(ci.useEventDSL).toBeTruthy()
  })
})

describe("pullRequestID", () => {
  it("returns the correct id when event.json contains pull_request data", () => {
    const ci = new GitHubActions({}, pullRequestEvent)
    expect(ci.pullRequestID).toEqual("2")
  })

  it("returns the correct id when event.json contains issue data", () => {
    const ci = new GitHubActions({}, issueEvent)
    expect(ci.pullRequestID).toEqual("2")
  })

  it("throws an error when event.json doesn't contain issue or pull_request data", () => {
    const ci = new GitHubActions({}, {})
    expect(() => {
      // tslint:disable-next-line:no-unused-expression
      ci.pullRequestID
    }).toThrow()
  })
})

describe("repoSlug", () => {
  it("returns the correct id when event.json contains pull_request data", () => {
    const ci = new GitHubActions({}, pullRequestEvent)
    expect(ci.repoSlug).toEqual("danger/danger-js")
  })

  it("returns the correct id when event.json contains issue data", () => {
    const ci = new GitHubActions({}, issueEvent)
    expect(ci.repoSlug).toEqual("danger/danger-js")
  })

  it("throws an error when event.json doesn't contain issue or pull_request data", () => {
    const ci = new GitHubActions({}, {})
    expect(() => {
      // tslint:disable-next-line:no-unused-expression
      ci.repoSlug
    }).toThrow()
  })
})
