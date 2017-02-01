import { GitHubAPI } from "../GitHubAPI"
import { FakeCI } from "../../../ci_source/providers/Fake"
import { requestWithFixturedJSON, requestWithFixturedContent } from "../../_tests/GitHub.test"

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

it.skip("fileContents expects to grab PR JSON and pull out a file API call", async () => {
  const mockSource = new FakeCI({})
  const api = new GitHubAPI("token", mockSource)
  // api.fetch = fetch

  api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")
  api.getFileContents = await requestWithFixturedContent("static_file.md")

  const info = await api.fileContents("my_path.md")
  expect(info).toEqual("The All-Defector is a purported glitch in the Dilemma Prison that appears to prisoners as themselves. This gogol always defects, hence the name.")//tslint:disable-line:max-line-length
})

describe("API testing", () => {
  let api: GitHubAPI

  beforeEach(() => {
    const mockSource = new FakeCI({})

    api = new GitHubAPI("ABCDE", mockSource)
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
    expect(await api.updateCommentWithID(123, "Hello!")).toMatchObject({
      api: "https://api.github.com/repos/artsy/emission/issues/comments/123",
      body: {"body": "Hello!"},
      headers: {
        Authorization: "token ABCDE",
        "Content-Type": "application/json",
      },
      method: "PATCH",
    })
  })
})

describe("Peril", () => {
  it("Allows setting additional headers", async () => {
    const mockSource = new FakeCI({})
    const api = new GitHubAPI("ABCDE", mockSource)
    api.fetch = fetchJSON
    api.additionalHeaders = { "CUSTOM": "HEADER" }

    const request = await api.getUserInfo()
    expect(request.headers).toEqual({
        Authorization: "token ABCDE",
        "CUSTOM": "HEADER",
        "Content-Type": "application/json",
    })
  })
})
