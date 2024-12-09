import { FakeCI } from "../../../ci_source/providers/Fake"
import { GitHubAPI } from "../GitHubAPI"
import { requestWithFixturedJSON } from "../../_tests/_github.test"
import { GitHubUser } from "../../../dsl/GitHubDSL"
import { GitHubFile } from "../GitHubAPI"

const fetchJSON = (api: any, params: any): Promise<any> => {
  return Promise.resolve({
    ok: true,
    json: () =>
      Promise.resolve({
        api,
        ...params,
      }),
  })
}

const fetchErrorJSON = (api: any, params: any): Promise<any> => {
  return Promise.resolve({
    ok: false,
    json: () =>
      Promise.resolve({
        api,
        ...params,
      }),
  })
}

const fetch = (api: any, params: any): Promise<any> => {
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
  )
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
    api.patch = jest.fn(() => ({ json: jest.fn() })) as any

    await api.updateCommentWithID("123", "Hello!")

    expect(api.patch).toHaveBeenCalledWith("repos/artsy/emission/issues/comments/123", {}, { body: "Hello!" })
  })

  it("getPullRequestDiff", async () => {
    api.fetch = jest.fn().mockReturnValue({
      ok: true,
      headers: new Headers({}),
      json: jest
        .fn()
        .mockImplementation(() =>
          Promise.resolve<GitHubFile[]>(JSON.parse('[{"filename": "file.txt", "status": "added", "patch": "+ hello"}]'))
        ),
    })

    let diff = await api.getPullRequestDiff()

    let expected = `
diff --git a/file.txt b/file.txt
new file mode 0
--- a/file.txt
+++ b/file.txt
+ hello
`

    expect(diff).toEqual(expected)

    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/artsy/emission/pulls/1/files?page=1&per_page=100",
      {
        body: null,
        headers: {
          Accept: "application/vnd.github.v3.diff",
          Authorization: "token ABCDE",
          "Content-Type": "application/json",
        },
        method: "GET",
      },
      undefined
    )
  })

  it("getDangerCommentIDs ignores comments not marked as generated", async () => {
    api.getAllOfResource = await requestWithFixturedJSON("github_inline_comments_with_danger.json")
    api.fetch = jest.fn().mockReturnValue({ ok: true })
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")

    const commentIDs = await api.getDangerCommentIDs("default")

    expect(commentIDs.length).toEqual(0)
  })

  it("getPullRequestComment gets only comments for given Pull Request", async () => {
    api.getAllOfResource = await requestWithFixturedJSON("github_pr_comments_with_danger.json")
    api.fetch = jest.fn().mockReturnValue({ ok: true })
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")

    const comments = await api.getPullRequestComments()

    expect(comments.length).toEqual(1)
  })

  it("getPullRequestInlineComment gets only comments for given dangerID", async () => {
    api.getAllOfResource = await requestWithFixturedJSON("github_inline_comments_with_danger.json")

    const comments = await api.getPullRequestInlineComments("default")

    expect(comments.length).toEqual(1)
    expect(comments[0].ownedByDanger).toBeTruthy()
  })

  it("getPullRequestInlineComment doesn't get comments as the dangerID is different", async () => {
    api.getAllOfResource = await requestWithFixturedJSON("github_inline_comments_with_danger.json")

    const comments = await api.getPullRequestInlineComments("other-danger-id")

    expect(comments.length).toEqual(0)
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

  it("postInlinePRReview success", async () => {
    api.fetch = fetchJSON
    const expectedJSON = {
      api: "https://api.github.com/repos/artsy/emission/pulls/1/reviews",
      headers: {
        Authorization: "token ABCDE",
        "Content-Type": "application/json",
      },
      method: "POST",
      body: '{"body":"","event":"COMMENT","commit_id":"","comments":[{"body":"","path":"","position":0}]}',
    }
    expect.assertions(1)
    await expect(api.postInlinePRReview("", [{ comment: "", path: "", position: 0 }])).resolves.toMatchObject(
      expectedJSON
    )
  })

  it("updateStatus('pending') success", async () => {
    api.fetch = jest.fn().mockReturnValue({ ok: true })
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")

    await expect(api.updateStatus("pending", "message")).resolves.toEqual(true)
    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/artsy/emission/statuses/cfa8fb80d2b65f4c4fa0b54d25352a3a0ff58f75",
      {
        headers: {
          Authorization: "token ABCDE",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: '{"state":"pending","context":"Danger","target_url":"http://danger.systems/js","description":"message"}',
      },
      true
    )
  })

  it("updateStatus with commitId success", async () => {
    api.fetch = jest.fn().mockReturnValue({ ok: true })
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")

    await expect(api.updateStatus("pending", "message", "", "", "a1234")).resolves.toEqual(true)
    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/artsy/emission/statuses/a1234",
      {
        headers: {
          Authorization: "token ABCDE",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: '{"state":"pending","context":"Danger","target_url":"http://danger.systems/js","description":"message"}',
      },
      true
    )
  })

  it("updateStatus(false) success", async () => {
    api.fetch = jest.fn().mockReturnValue({ ok: true })
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")

    await expect(api.updateStatus(false, "message")).resolves.toEqual(true)
    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/artsy/emission/statuses/cfa8fb80d2b65f4c4fa0b54d25352a3a0ff58f75",
      {
        headers: {
          Authorization: "token ABCDE",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: '{"state":"failure","context":"Danger","target_url":"http://danger.systems/js","description":"message"}',
      },
      true
    )
  })

  it("updateStatus(true, 'message', 'http://example.org') success", async () => {
    api.fetch = jest.fn().mockReturnValue({ ok: true })
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")

    await expect(api.updateStatus(true, "message", "http://example.org")).resolves.toEqual(true)
    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/artsy/emission/statuses/cfa8fb80d2b65f4c4fa0b54d25352a3a0ff58f75",
      {
        headers: {
          Authorization: "token ABCDE",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: '{"state":"success","context":"Danger","target_url":"http://example.org","description":"message"}',
      },
      true
    )
  })

  it("updateStatus(true) failed", async () => {
    api.fetch = jest.fn().mockReturnValue({ ok: false })
    api.getPullRequestInfo = await requestWithFixturedJSON("github_pr.json")

    await expect(api.updateStatus(true, "message")).resolves.toEqual(false)
    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/artsy/emission/statuses/cfa8fb80d2b65f4c4fa0b54d25352a3a0ff58f75",
      {
        headers: {
          Authorization: "token ABCDE",
          "Content-Type": "application/json",
        },
        method: "POST",
        body: '{"state":"success","context":"Danger","target_url":"http://danger.systems/js","description":"message"}',
      },
      true
    )
  })

  it("deleteCommentWithID", async () => {
    api.fetch = jest.fn().mockReturnValue({ status: 204 })
    await api.deleteCommentWithID("123")

    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/artsy/emission/issues/comments/123",
      {
        body: null,
        headers: {
          Authorization: "token ABCDE",
          "Content-Type": "application/json",
        },
        method: "DELETE",
      },
      undefined
    )
  })

  it("deleteInlineCommentWithID", async () => {
    api.fetch = jest.fn().mockReturnValue({ status: 204 })
    await api.deleteInlineCommentWithID("123")

    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/artsy/emission/pulls/comments/123",
      {
        body: null,
        headers: {
          Authorization: "token ABCDE",
          "Content-Type": "application/json",
        },
        method: "DELETE",
      },
      false
    )
  })
})

describe("Bots", () => {
  let api: GitHubAPI

  beforeEach(() => {
    const mockSource = new FakeCI({})
    api = new GitHubAPI(mockSource, "ABCDE")
    api.fetch = jest.fn()
    api.additionalHeaders = { CUSTOM: "HEADER" }
    delete process.env.PERIL_BOT_USER_ID
    delete process.env.DANGER_GITHUB_API_TOKEN
    delete process.env.GITHUB_WORKFLOW
    delete process.env.DANGER_GHE_ACTIONS_BOT_USER_ID
  })

  it("Allows setting additional headers", async () => {
    await api.get("user")
    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/user",
      {
        body: null,
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

    await api.get("user", {
      Accept: "application/vnd.github.v3.diff",
    })

    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/user",
      {
        body: null,
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

  it("getUserId return undefined if no auth is defined", async () => {
    api.getUserInfo = () => Promise.resolve<GitHubUser>(JSON.parse('{"status": 403}'))
    const userID = await api.getUserID()
    expect(userID).toBe(undefined)
  })

  it("getUserId return PERIL_BOT_USER_ID when set", async () => {
    api.getUserInfo = () => Promise.resolve<GitHubUser>(JSON.parse('{"status": 403}'))
    process.env.PERIL_BOT_USER_ID = "1"

    const userID = await api.getUserID()
    expect(userID).toBe(1)
  })

  // It should use the configured token to retrive the user ID
  it("getUserID return default user's ID when set", async () => {
    api.fetch = jest.fn().mockReturnValue({
      json: jest.fn().mockImplementation(() => Promise.resolve<GitHubUser>(JSON.parse('{"id": 2}'))),
    })
    const userID = await api.getUserID()

    // Ensure we call the user endpoint with the configured token
    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.github.com/user",
      {
        body: null,
        headers: {
          Authorization: "token ABCDE",
          CUSTOM: "HEADER",
          "Content-Type": "application/json",
        },
        method: "GET",
      },
      undefined
    )
    expect(userID).toBe(2)
  })

  it("Makes getUserId return DANGER_GHE_ACTIONS_BOT_USER_ID when set", async () => {
    api.getUserInfo = () => Promise.resolve<GitHubUser>(JSON.parse('{"status": 403}'))
    process.env.GITHUB_WORKFLOW = "foobar"
    process.env.DANGER_GHE_ACTIONS_BOT_USER_ID = "3"

    const userID = await api.getUserID()
    expect(userID).toBe(3)
  })

  it("getUserID return default GitHub Actions bot ID if not overwritten", async () => {
    api.getUserInfo = () => Promise.resolve<GitHubUser>(JSON.parse('{"status": 403}'))
    process.env.GITHUB_WORKFLOW = "foobar"

    const userID = await api.getUserID()
    expect(userID).toBe(41898282)
  })
})
