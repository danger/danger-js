import { BitBucketCloudAPI } from "../BitBucketCloudAPI"
import { dangerSignaturePostfix } from "../../../runner/templates/bitbucketCloudTemplate"
import { DangerResults } from "../../../dsl/DangerResults"
import { URLSearchParams } from "url"

const fetchText = (api: any, params: any): Promise<any> => {
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

describe("API testing - BitBucket Cloud", () => {
  let api: BitBucketCloudAPI
  let jsonResult: () => any
  let textResult: string
  const expectedJSONHeaders = {
    "Content-Type": "application/json",
    Authorization: `Basic ${new Buffer("username:password").toString("base64")}`,
  }

  function APIFactory(username: string, password: string, uuid: string) {
    const api = new BitBucketCloudAPI(
      { repoSlug: "foo/bar", pullRequestID: "1" },
      {
        type: "PASSWORD",
        username,
        password,
        uuid,
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
    api = APIFactory("username", "password", "{1234-1234-1234-1234}")
  })

  it("getPullRequestsFromBranch", async () => {
    jsonResult = () => ({ isLastPage: true, values: [1] })
    const result = await api.getPullRequestsFromBranch("branch")

    expect(api.fetch).toHaveBeenCalledWith(
      `https://api.bitbucket.org/2.0/repositories/foo/bar/${encodeURI(`pullrequests?q=source.branch.name = "branch"`)}`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual([1])
  })

  it("getPullRequestInfo", async () => {
    jsonResult = () => ({ pr: "info" })
    const result = await api.getPullRequestInfo()

    expect(api.fetch).toHaveBeenCalledWith(
      `https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual({ pr: "info" })
  })

  it("getPullRequestCommits", async () => {
    jsonResult = () => ({ next: undefined, values: ["commit"] })
    const result = await api.getPullRequestCommits()

    expect(api.fetch).toHaveBeenCalledWith(
      `https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/commits`,
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(["commit"])
  })

  it("should not fetch commits on the second time", async () => {
    const mockJsonResult = jest.fn().mockReturnValue({ next: undefined, values: ["commit"] })
    jsonResult = mockJsonResult

    await api.getPullRequestCommits()
    const result2 = await api.getPullRequestCommits()

    expect(mockJsonResult).toBeCalledTimes(1)
    expect(result2).toEqual(["commit"])
  })

  it("getPullRequestDiff", async () => {
    api.fetch = fetchText
    let text = await api.getPullRequestDiff()
    expect(JSON.parse(text)).toMatchObject({
      method: "GET",
      api: "https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/diff",
      headers: expectedJSONHeaders,
    })
  })

  it("getFileContents", async () => {
    api.fetch = fetchText
    let text = await api.getFileContents("Dangerfile.ts", api.repoMetadata.repoSlug, "a0cd")

    expect(JSON.parse(text)).toMatchObject({
      method: "GET",
      api: "https://api.bitbucket.org/2.0/repositories/foo/bar/src/a0cd/Dangerfile.ts",
      headers: expectedJSONHeaders,
    })
  })

  it("getPullRequestComments", async () => {
    jsonResult = () => ({ next: undefined, values: [{ content: { raw: "Hello" } }] })
    const result = await api.getPullRequestComments()

    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/comments?q=deleted=false",
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    // should filtered out item that doesn't contain comment
    expect(result).toEqual([{ content: { raw: "Hello" } }])
  })

  it("getDangerInlineComments", async () => {
    jsonResult = () => ({
      values: [
        {
          content: {
            raw:
              "\n[//]: # (danger-id-1;)\n[//]: # (  File: dangerfile.ts;\n  Line: 5;)\n\n- :warning: Hello updates\n\n\n  ",
          },
          id: 1234,
          inline: {
            from: 5,
            path: "dangerfile.ts",
          },
          user: {
            uuid: "{1234-1234-1234-1234}",
            display_name: "name",
          },
        },
      ],
    })
    const comments = await api.getDangerInlineComments("1")
    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/comments?q=deleted=false",
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(comments.length).toEqual(1)
    expect(comments[0].ownedByDanger).toBeTruthy()
  })

  it("getPullRequestActivities", async () => {
    jsonResult = () => ({ isLastPage: true, values: ["activity"] })
    const result = await api.getPullRequestActivities()

    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/activity",
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual(["activity"])
  })

  it("getDangerComments", async () => {
    const commitID = "e70f3d6468f61a4bef68c9e6eaba9166b096e23c"
    jsonResult = () => ({
      isLastPage: true,
      values: [
        {
          content: {
            raw: `FAIL! danger-id-1; ${dangerSignaturePostfix({} as DangerResults, commitID)}`,
          },
          user: {
            display_name: "name",
            uuid: "{1234-1234-1234-1234}",
          },
        },
        {
          content: {
            raw: "not a danger comment",
          },
          user: {
            display_name: "someone",
            uuid: "{1234-1234-1234-1235}",
          },
        },
      ],
    })
    const result = await api.getDangerComments("1")

    expect(api.fetch).toHaveBeenCalledWith(
      "https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/comments?q=deleted=false",
      { method: "GET", body: null, headers: expectedJSONHeaders },
      undefined
    )
    expect(result).toEqual([
      {
        content: {
          raw: `FAIL! danger-id-1; ${dangerSignaturePostfix({} as DangerResults, commitID)}`,
        },
        user: {
          uuid: "{1234-1234-1234-1234}",
          display_name: "name",
        },
      },
    ])
  })

  it("postBuildStatus", async () => {
    const payload = {
      state: "SUCCESSFUL" as "SUCCESSFUL",
      key: "key",
      name: "name",
      url: "url",
      description: "description...",
    }
    await api.postBuildStatus("a0cd", payload)

    expect(api.fetch).toHaveBeenCalledWith(
      `https://api.bitbucket.org/2.0/repositories/foo/bar/commit/a0cd/statuses/build`,
      { method: "POST", body: JSON.stringify(payload), headers: expectedJSONHeaders },
      undefined
    )
  })

  it("postPRComment", async () => {
    const comment = "comment..."
    await api.postPRComment(comment)

    expect(api.fetch).toHaveBeenCalledWith(
      `https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content: { raw: comment } }),
        headers: expectedJSONHeaders,
      },
      undefined
    )
  })

  it("deleteComment", async () => {
    await api.deleteComment("1")

    expect(api.fetch).toHaveBeenCalledWith(
      `https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/comments/1`,
      { method: "DELETE", body: `{}`, headers: expectedJSONHeaders },
      undefined
    )
  })

  it("updateComment", async () => {
    await api.updateComment("1", "Hello!")

    expect(api.fetch).toHaveBeenCalledWith(
      `https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/comments/1`,
      {
        method: "PUT",
        body: JSON.stringify({ content: { raw: "Hello!" } }),
        headers: expectedJSONHeaders,
      },
      undefined
    )
  })

  it("postInlinePRComment", async () => {
    await api.postInlinePRComment("comment...", 5, "dangerfile.ts")
    expect(api.fetch).toHaveBeenCalledWith(
      `https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1/comments`,
      {
        method: "POST",
        body: JSON.stringify({ content: { raw: "comment..." }, inline: { to: 5, path: "dangerfile.ts" } }),
        headers: expectedJSONHeaders,
      },
      undefined
    )
  })

  it("should fetch accessToken", async () => {
    api = new BitBucketCloudAPI(
      { repoSlug: "foo/bar", pullRequestID: "1" },
      {
        type: "OAUTH",
        oauthSecret: "superSecretOAUTH",
        oauthKey: "superOAUTHKey",
        uuid: "{1234-1234-1234-1234}",
      }
    )
    let isFetchedToken = false
    let fetch = jest.fn().mockReturnValue({
      status: 200,
      ok: true,
      json: () => {
        if (isFetchedToken === false) {
          isFetchedToken = true
          return {
            access_token: "bla bla bla bla",
          }
        } else {
          return { pr: "info" }
        }
      },
      text: () => textResult,
    })
    api.fetch = fetch

    const expectedAuthBody = new URLSearchParams()
    expectedAuthBody.append("grant_type", "client_credentials")

    const expectedAuthHeaders = {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${new Buffer("superOAUTHKey:superSecretOAUTH").toString("base64")}`,
    }
    const expectedOAUTHRequestHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer bla bla bla bla`,
    }

    const result = await api.getPullRequestInfo()
    expect(api.fetch).toBeCalledTimes(2)

    expect(fetch.mock.calls[0][0]).toBe("https://bitbucket.org/site/oauth2/access_token")
    const firstCalledBody = fetch.mock.calls[0][1]
    expect(firstCalledBody["method"]).toBe("POST")
    expect(firstCalledBody["headers"]).toEqual(expectedAuthHeaders)
    expect(firstCalledBody["body"].toString()).toEqual(expectedAuthBody.toString())

    expect(api.fetch).toHaveBeenNthCalledWith(
      2,
      `https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1`,
      { method: "GET", body: null, headers: expectedOAUTHRequestHeaders },
      undefined
    )

    expect(result).toEqual({ pr: "info" })
  })

  it("shouldn't fetch accessToken if it exists", async () => {
    api = new BitBucketCloudAPI(
      { repoSlug: "foo/bar", pullRequestID: "1" },
      {
        type: "OAUTH",
        oauthSecret: "superSecretOAUTH",
        oauthKey: "superOAUTHKey",
        uuid: "{1234-1234-1234-1234}",
      }
    )

    api.fetch = jest.fn().mockReturnValue({
      status: 200,
      ok: true,
      json: () => ({ pr: "info" }),
      text: () => textResult,
    })

    api.accessToken = "bla bla bla bla"

    const expectedOAUTHRequestHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer bla bla bla bla`,
    }

    const result = await api.getPullRequestInfo()
    expect(api.fetch).toBeCalledTimes(1)
    expect(api.fetch).toHaveBeenNthCalledWith(
      1,
      `https://api.bitbucket.org/2.0/repositories/foo/bar/pullrequests/1`,
      { method: "GET", body: null, headers: expectedOAUTHRequestHeaders },
      undefined
    )

    expect(result).toEqual({ pr: "info" })
  })

  it("should fetch uuid if not exists given username", async () => {
    api = new BitBucketCloudAPI(
      { repoSlug: "foo/bar", pullRequestID: "1" },
      {
        type: "PASSWORD",
        username: "foo",
        password: "bar",
      }
    )
    let requestNo = 0
    let fetch = jest.fn().mockReturnValue({
      status: 200,
      ok: true,
      json: () => {
        requestNo += 1
        if (requestNo === 1) {
          return {
            uuid: "{1234-1234-1234-1234}",
          }
        } else {
          return { pr: "info" }
        }
      },
      text: () => textResult,
    })

    api.fetch = fetch

    const result = await api.getPullRequestInfo()
    expect(api.fetch).toBeCalledTimes(2)
    expect(fetch.mock.calls[0][0]).toBe("https://api.bitbucket.org/2.0/user")
    expect(result).toEqual({ pr: "info" })
  })

  it("should fetch uuid if not exists given oauth key", async () => {
    api = new BitBucketCloudAPI(
      { repoSlug: "foo/bar", pullRequestID: "1" },
      {
        type: "OAUTH",
        oauthSecret: "superSecretOAUTH",
        oauthKey: "superOAUTHKey",
      }
    )
    let requestNo = 0
    let fetch = jest.fn().mockReturnValue({
      status: 200,
      ok: true,
      json: () => {
        requestNo += 1
        if (requestNo === 1) {
          return {
            access_token: "bla bla bla bla",
          }
        } else if (requestNo === 2) {
          return {
            uuid: "{1234-1234-1234-1234}",
          }
        } else {
          return { pr: "info" }
        }
      },
      text: () => textResult,
    })

    api.fetch = fetch

    const result = await api.getPullRequestInfo()
    expect(api.fetch).toBeCalledTimes(3)
    expect(fetch.mock.calls[1][0]).toBe("https://api.bitbucket.org/2.0/user")
    expect(result).toEqual({ pr: "info" })
  })

  it("should fetch uuid if not exists given accessToken", async () => {
    api = new BitBucketCloudAPI(
      { repoSlug: "foo/bar", pullRequestID: "1" },
      {
        type: "OAUTH",
        oauthSecret: "superSecretOAUTH",
        oauthKey: "superOAUTHKey",
      }
    )
    let requestNo = 0
    let fetch = jest.fn().mockReturnValue({
      status: 200,
      ok: true,
      json: () => {
        requestNo += 1
        if (requestNo === 1) {
          return {
            uuid: "{1234-1234-1234-1234}",
          }
        } else {
          return { pr: "info" }
        }
      },
      text: () => textResult,
    })

    api.fetch = fetch
    api.accessToken = "bla bla bla bla"

    const result = await api.getPullRequestInfo()
    expect(api.fetch).toBeCalledTimes(2)
    expect(fetch.mock.calls[0][0]).toBe("https://api.bitbucket.org/2.0/user")
    expect(result).toEqual({ pr: "info" })
  })

  it("shouldn't fetch uuid if uuid exists (from api calling)", async () => {
    api = new BitBucketCloudAPI(
      { repoSlug: "foo/bar", pullRequestID: "1" },
      {
        type: "OAUTH",
        oauthSecret: "superSecretOAUTH",
        oauthKey: "superOAUTHKey",
      }
    )

    let fetch = jest.fn().mockReturnValue({
      status: 200,
      ok: true,
      json: () => {
        return { pr: "info" }
      },
      text: () => textResult,
    })

    api.fetch = fetch
    api.accessToken = "bla bla bla bla"
    api.uuid = "{1234-1234-1234-1234}"

    const result = await api.getPullRequestInfo()
    expect(api.fetch).toBeCalledTimes(1)
    expect(result).toEqual({ pr: "info" })
  })
})
