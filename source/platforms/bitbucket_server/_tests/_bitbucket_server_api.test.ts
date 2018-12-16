import { BitBucketServerAPI } from "../BitBucketServerAPI"
import { dangerSignaturePostfix } from "../../../runner/templates/bitbucketServerTemplate"
import { DangerResults } from "../../../dsl/DangerResults"

describe("API testing - BitBucket Server", () => {
  let api: BitBucketServerAPI
  let jsonResult: () => any
  let textResult: string
  const host = "http://localhost:7990"
  const expectedJSONHeaders = {
    "Content-Type": "application/json",
    Authorization: `Basic ${new Buffer("username:password").toString("base64")}`,
  }

  function APIFactory({ password, token }: { password?: string; token?: string }) {
    const api = new BitBucketServerAPI(
      { repoSlug: "projects/FOO/repos/BAR", pullRequestID: "1" },
      {
        host,
        username: "username",
        password,
        token,
      }
    )

    api.fetch = jest.fn().mockReturnValue({
      status: 200,
      ok: true,
      json: () => jsonResult(),
      text: () => textResult,
    })

    return api
  }

  beforeEach(() => {
    api = APIFactory({ password: "password" })
  })

  it("getPullRequestsFromBranch", async () => {
    jsonResult = () => ({ isLastPage: true, values: [1] })
    const result = await api.getPullRequestsFromBranch("branch")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests` +
        `?at=refs/heads/branch&withProperties=false&withAttributes=false&start=0`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual([1])
  })

  it("getPullRequestInfo", async () => {
    jsonResult = () => ({ pr: "info" })
    const result = await api.getPullRequestInfo()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual({ pr: "info" })
  })

  it("getPullRequestCommits", async () => {
    jsonResult = () => ({ isLastPage: true, values: ["commit"] })
    const result = await api.getPullRequestCommits()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/commits` +
        //
        `?start=0`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(["commit"])
  })

  it("getStructuredDiffForFile", async () => {
    jsonResult = () => ({ diffs: ["diff"] })
    const result = await api.getStructuredDiffForFile("BASE", "HEAD", "filename.txt")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/compare/diff/` +
        `filename.txt` +
        `?withComments=false&from=BASE&to=HEAD`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(["diff"])
  })

  it("getPullRequestChanges", async () => {
    jsonResult = jest
      .fn()
      .mockReturnValueOnce({
        nextPageStart: 1,
        values: ["1"],
      })
      .mockReturnValueOnce({
        isLastPage: true,
        values: ["2"],
      })
    const result = await api.getPullRequestChanges()

    expect(api.fetch).toHaveBeenCalledTimes(2)

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/changes` +
        //
        `?start=0`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/changes` +
        //
        `?start=1`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(["1", "2"])
  })

  it("getPullRequestComments", async () => {
    jsonResult = () => ({ isLastPage: true, values: ["comment"] })
    const result = await api.getPullRequestComments()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/activities` +
        //
        `?fromType=COMMENT&start=0`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(["comment"])
  })

  it("getPullRequestActivities", async () => {
    jsonResult = () => ({ isLastPage: true, values: ["activity"] })
    const result = await api.getPullRequestActivities()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/activities` +
        //
        `?fromType=ACTIVITY&start=0`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(["activity"])
  })

  it("getIssues", async () => {
    jsonResult = () => ({ issue: "key" })
    const result = await api.getIssues()

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/jira/1.0/projects/FOO/repos/BAR/pull-requests/1/issues`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual({ issue: "key" })
  })

  it("getDangerComments", async () => {
    const commitID = "e70f3d6468f61a4bef68c9e6eaba9166b096e23c"
    jsonResult = () => ({
      isLastPage: true,
      values: [
        {
          comment: {
            text: `FAIL! danger-id-1; ${dangerSignaturePostfix({} as DangerResults, commitID)}`,
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
    })
    const result = await api.getDangerComments("1")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/activities?fromType=COMMENT&start=0`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual([
      {
        text: `FAIL! danger-id-1; ${dangerSignaturePostfix({} as DangerResults, commitID)}`,
        author: {
          name: "username",
        },
      },
    ])
  })

  it("getDangerInlineComments", async () => {
    jsonResult = () => ({
      isLastPage: true,
      values: [
        {
          comment: {
            text:
              "\n[//]: # (danger-id-default;)\n[//]: # (  File: README.md;\n  Line: 5;)\n\n- :warning: Hello updates\n\n\n  ",
            author: {
              name: "username",
            },
          },
          commentAnchor: {
            line: 5,
            lineType: "ADDED",
          },
        },
      ],
    })
    const comments = await api.getDangerInlineComments("default")
    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/activities?fromType=COMMENT&start=0`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(comments.length).toEqual(1)
    expect(comments[0].ownedByDanger).toBeTruthy()
  })

  it("getFileContents", async () => {
    textResult = "contents..."
    const result = await api.getFileContents("path/to/foo.txt", "projects/FOO/repos/BAR", "master")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/projects/FOO/repos/BAR/raw/path/to/foo.txt?at=master`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
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

  it("postInlinePRComment", async () => {
    const comment = "comment..."
    await api.postInlinePRComment(comment, 5, "add", "dangerfile.ts")
    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/comments`,
      {
        method: "POST",
        body: '{"text":"comment...","anchor":{"line":5,"lineType":"ADDED","fileType":"TO","path":"dangerfile.ts"}}',
        headers: expectedJSONHeaders,
      },
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

  it("deleteComment with reply", async () => {
    api.fetch = jest
      .fn()
      .mockReturnValueOnce({
        status: 409,
        ok: true,
        json: () => ({
          errors: {
            exceptionName: "com.atlassian.bitbucket.comment.CommentDeletionException",
          },
        }),
        text: () => textResult,
      })
      .mockReturnValueOnce({
        status: 200,
        ok: true,
        json: () => jsonResult(),
        text: () => textResult,
      })

    await api.deleteComment({ id: 1, version: 2 } as any)

    expect(api.fetch).toHaveBeenCalledTimes(2)

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/comments/1?version=2`,
      { method: "DELETE", body: `{}`, headers: expectedJSONHeaders },
      undefined
    )

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/rest/api/1.0/projects/FOO/repos/BAR/pull-requests/1/comments/1`,
      {
        method: "PUT",
        body: JSON.stringify({ text: "(Review Retracted)", version: 2 }),
        headers: expectedJSONHeaders,
      },
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

  it("use token", async () => {
    api = APIFactory({ token: "token" })

    await api.get("")

    expect(api.fetch).toHaveBeenCalledWith(
      `${host}/`,
      {
        method: "GET",
        body: null,
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer token",
        },
      },
      undefined
    )
  })
})
