import { BitBucketServerAPI } from "../BitBucketServerAPI"
import { dangerSignaturePostfix } from "../../../runner/templates/bitbucketServerTemplate"

describe("API testing - BitBucket Server", () => {
  let api: BitBucketServerAPI
  let jsonResult: any
  let textResult: string
  const host = "http://localhost:7990"
  const expectedJSONHeaders = {
    "Content-Type": "application/json",
    Authorization: `Basic ${new Buffer("username:password").toString("base64")}`,
  }

  beforeEach(() => {
    api = new BitBucketServerAPI(
      { repoSlug: "projects/FOO/repos/BAR", pullRequestID: "1" },
      {
        host,
        username: "username",
        password: "password",
      }
    )
    api.fetch = jest.fn().mockReturnValue({
      status: 200,
      ok: true,
      json: () => jsonResult,
      text: () => textResult,
    })
  })

  it("getPullRequestsFromBranch", async () => {
    jsonResult = { values: [1] }
    const result = await api.getPullRequestsFromBranch("branch")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests` +
        `?at=refs/heads/branch&withProperties=false&withAttributes=false`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(jsonResult.values)
  })

  it("getPullRequestInfo", async () => {
    jsonResult = { pr: "info" }
    const result = await api.getPullRequestInfo()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(jsonResult)
  })

  it("getPullRequestCommits", async () => {
    jsonResult = { values: ["commit"] }
    const result = await api.getPullRequestCommits()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/commits`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(jsonResult.values)
  })

  it("getStructuredDiff", async () => {
    jsonResult = { diffs: ["diff"] }
    const result = await api.getStructuredDiff("BASE", "HEAD")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/compare/diff` +
        //
        `?withComments=false&from=BASE&to=HEAD`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(jsonResult.diffs)
  })

  it("getPullRequestDiff", async () => {
    jsonResult = { diffs: ["diff"] }
    const result = await api.getPullRequestDiff()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/diff` +
        //
        `?withComments=false`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(jsonResult.diffs)
  })

  it("getPullRequestComments", async () => {
    jsonResult = { values: ["comment"] }
    const result = await api.getPullRequestComments()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/activities` +
        //
        `?fromType=COMMENT`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(jsonResult.values)
  })

  it("getPullRequestActivities", async () => {
    jsonResult = { values: ["activity"] }
    const result = await api.getPullRequestActivities()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/activities` +
        //
        `?fromType=ACTIVITY`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(jsonResult.values)
  })

  it("getIssues", async () => {
    jsonResult = { issue: "key" }
    const result = await api.getIssues()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/jira/1.0/projects/FOO/repos/BAR/pull-requests/1/issues`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(jsonResult)
  })

  it("getDangerComments", async () => {
    jsonResult = {
      values: [
        {
          comment: {
            text: `FAIL! danger-id-1; ${dangerSignaturePostfix}`,
            author: {
              name: "username",
            },
          },
        },
        {
          comment: null,
        },
        {
          comment: {
            text: "not a danger comment",
            author: {
              name: "azz",
            },
          },
        },
      ],
    }
    const result = await api.getDangerComments("1")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/activities?fromType=COMMENT`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual([jsonResult.values[0].comment])
  })

  it("getFileContents", async () => {
    textResult = "contents..."
    const result = await api.getFileContents("path/to/foo.txt", "projects/FOO/repos/BAR", "master")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/projects/FOO/repos/BAR/raw/path/to/foo.txt?at=master`,
      { method: "GET", body: {}, headers: expectedJSONHeaders },
      true
    )
    expect(result).toEqual(textResult)
  })

  it("postBuildStatus", async () => {
    const payload = {
      state: "foo",
      key: "key",
      name: "name",
      url: "url",
      description: "description...",
    }
    await api.postBuildStatus("a0cd", payload)

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/build-status/1.0/commits/a0cd`,
      { method: "POST", body: JSON.stringify(payload), headers: expectedJSONHeaders },
      undefined
    )
  })

  it("postPRComment", async () => {
    const comment = "comment..."
    await api.postPRComment(comment)

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/comments`,
      { method: "POST", body: JSON.stringify({ text: comment }), headers: expectedJSONHeaders },
      undefined
    )
  })

  it("deleteComment", async () => {
    await api.deleteComment({ id: 1, version: 2 } as any)

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/comments/1?version=2`,
      { method: "DELETE", body: `{}`, headers: expectedJSONHeaders },
      undefined
    )
  })

  it("updateComment", async () => {
    await api.updateComment({ id: 123, version: 11 } as any, "Hello!")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/comments/123`,
      {
        method: "PUT",
        body: JSON.stringify({ text: "Hello!", version: 11 }),
        headers: expectedJSONHeaders,
      },
      undefined
    )
  })
})
