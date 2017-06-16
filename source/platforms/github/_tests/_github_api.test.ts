import { GitHubAPI } from "../GitHubAPI"
import { FakeCI } from "../../../ci_source/providers/Fake"
import { requestWithFixturedJSON } from "../../_tests/_github.test"

const fetchJSON = (api, params): Promise<any> => {
  return Promise.resolve({
    json: () =>
      Promise.resolve({
        api,
        ...params,
      }),
  })
}

const fetch = (api, params): Promise<any> => {
  return Promise.resolve({
    api,
    ...params,
  })
}

it("fileContents expects to grab PR JSON and pull out a file API call", async () => {
  const api = new GitHubAPI({ repoSlug: "unused/metadata", pullRequestID: "1" }, "token")

  api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")
  api.getFileContents = await requestWithFixturedJSON("static_file.json")

  const info = await api.fileContents("my_path.md")
  expect(info).toEqual(
    "The All-Defector is a purported glitch in the Dilemma Prison that appears to prisoners as themselves. This gogol always defects, hence the name."
  ) //tslint:disable-line:max-line-length
})

describe("API testing", () => {
  let api: GitHubAPI

  beforeEach(() => {
    api = new GitHubAPI({ repoSlug: "artsy/emission", pullRequestID: "1" }, "ABCDE")
  })

  it("getUserInfo", async () => {
    api.fetch = fetchJSON
    expect(await api.getUserInfo()).toMatchObject({
      api: "https://api.github.com/user",
      headers: {
        Authorization: "token ABCDE",
        "Content-Type": "application/json",
      },
      method: "GET",
    })
  })

  it("updateCommentWithID", async () => {
    api.fetch = fetch
    api.patch = jest.fn(() => ({ json: jest.fn() }))

    await api.updateCommentWithID(123, "Hello!")

    expect(api.patch).toHaveBeenCalledWith("repos/artsy/emission/issues/comments/123", {}, { body: "Hello!" })
  })
})

describe("Peril", () => {
  let api: GitHubAPI

  beforeEach(() => {
    const mockSource = new FakeCI({})
    api = new GitHubAPI(mockSource, "ABCDE")
    api.fetch = jest.fn()
    api.additionalHeaders = { CUSTOM: "HEADER" }
  })

  it("Allows setting additional headers", async () => {
    const request = await api.get("user")
    expect(api.fetch).toHaveBeenCalledWith("https://api.github.com/user", {
      body: {},
      headers: {
        Authorization: "token ABCDE",
        CUSTOM: "HEADER",
        "Content-Type": "application/json",
      },
      method: "GET",
    })
  })

  describe("Allows setting DANGER_GITHUB_APP env variable", () => {
    beforeEach(() => {
      process.env.DANGER_GITHUB_APP = "1"
    })

    afterEach(() => {
      delete process.env.DANGER_GITHUB_APP
    })

    it("Makes getUserId return undefined", async () => {
      expect(await api.getUserID()).toBeUndefined()
    })
  })
})
