import { GitHubAPI } from "../GitHubAPI"
import { FakeCI } from "../../../ci_source/providers/Fake"
import { requestWithFixturedJSON } from "../../_tests/GitHub.test"

const fetchJSON = (api, params): Promise<any> => {
  return Promise.resolve({
    json: () => Promise.resolve({
      api,
      ...params
    })
  })
}

const fetch = (api, params): Promise<any> => {
  return Promise.resolve({
    api,
    ...params
  })
}

it("fileContents expects to grab PR JSON and pull out a file API call", async () => {
  const api = new GitHubAPI({ repoSlug: "unused/metadata", pullRequestID: "1" }, "token")

  api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")
  api.getFileContents = await requestWithFixturedJSON("static_file.json")

  const info = await api.fileContents("my_path.md")
  expect(info).toEqual("The All-Defector is a purported glitch in the Dilemma Prison that appears to prisoners as themselves. This gogol always defects, hence the name.")//tslint:disable-line:max-line-length
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

    expect(api.patch).toHaveBeenCalledWith("repos/artsy/emission/issues/comments/123", {}, {"body": "Hello!"})
  })
})

describe("Peril", () => {
  it("Allows setting additional headers", async () => {
    const mockSource = new FakeCI({})
    const api = new GitHubAPI(mockSource, "ABCDE")
    api.fetch = jest.fn()
    api.additionalHeaders = { "CUSTOM": "HEADER" }

    const request = await api.get("user")
    expect(request.headers).toEqual({
        Authorization: "token ABCDE",
        "CUSTOM": "HEADER",
        "Content-Type": "application/json",
    })
  })
})
