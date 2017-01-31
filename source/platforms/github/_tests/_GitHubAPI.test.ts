import { GitHubAPI } from "../GitHubAPI"
import { FakeCI } from "../../../ci_source/providers/Fake"
import { requestWithFixturedJSON, requestWithFixturedContent } from "../../_tests/GitHub.test"

const fetch = (api, params): Promise<any> => {
  return Promise.resolve({
    json: () => Promise.resolve({
      api,
      ...params
    })
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
    api.fetch = fetch
  })

  it("getUserInfo", async () => {
    expect(await api.getUserInfo()).toMatchObject({
      api: "https://api.github.com/user",
      headers: {
        Authorization: "token ABCDE",
        "Content-Type": "application/json",
      },
      method: "GET",
    })
  })
})
