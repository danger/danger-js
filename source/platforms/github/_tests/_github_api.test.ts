import { FakeCI } from "../../../ci_source/providers/Fake"
import { GitHubAPI } from "../GitHubAPI"
import { requestWithFixturedJSON } from "../../_tests/_github.test"

const fetchJSON = (api, params): Promise<any> => {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        api,
        ...params,
      }),
  })
}

const fetchErrorJSON = (api, params): Promise<any> => {
  return Promise.resolve({
    ok: false,
    json: () =>
      Promise.resolve({
        api,
        ...params,
      }),
  })
}

const fetchText = (api, params): Promise<any> => {
  return Promise.resolve({
    ok: true,
    text: () =>
      Promise.resolve(
        JSON.stringify({
          api,
          ...params,
        })
      ),
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

  it("getPullRequestDiff", async () => {
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")
    api.fetch = fetchText
    let text = await api.getPullRequestDiff()
    expect(JSON.parse(text)).toMatchObject({
      api: "https://api.github.com/repos/artsy/emission/pulls/1",
      headers: {
        Authorization: "token ABCDE",
        Accept: "application/vnd.github.v3.diff",
        "Content-Type": "application/json",
      },
    })
  })

  it("postInlinePRComment success", async () => {
    api.fetch = fetchJSON
    const expectedJSON = {
      api: "https://api.github.com/repos/artsy/emission/pulls/1/comments",
      headers: {
        Authorization: "token ABCDE",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: '{"body":"","commit_id":"","path":"","position":0}',
    }
    expect.assertions(1)
    await expect(api.postInlinePRComment("", "", "", 0)).resolves.toMatchObject(expectedJSON)
  })

  it("postInlinePRComment error", async () => {
    api.fetch = fetchErrorJSON
    const expectedJSON = {
      api: "https://api.github.com/repos/artsy/emission/pulls/1/comments",
      headers: {
        Authorization: "token ABCDE",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: '{"body":"","commit_id":"","path":"","position":0}',
    }
    expect.assertions(1)
    await expect(api.postInlinePRComment("", "", "", 0)).rejects.toEqual(expectedJSON)
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
    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/user",
      {
        body: {},
        headers: {
          Authorization: "token ABCDE",
          CUSTOM: "HEADER",
          "Content-Type": "application/json",
        },
        method: "GET",
      },
      undefined
    )
  })

  it("Merges two Accept headers", async () => {
    api.additionalHeaders = { Accept: "application/vnd.github.machine-man-preview+json" }

    const request = await api.get("user", {
      Accept: "application/vnd.github.v3.diff",
    })

    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/user",
      {
        body: {},
        headers: {
          Accept: "application/vnd.github.machine-man-preview+json, application/vnd.github.v3.diff",
          Authorization: "token ABCDE",
          "Content-Type": "application/json",
        },
        method: "GET",
      },
      undefined
    )
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
