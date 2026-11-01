import nock from "nock"
import GitLabAPI from "../GitLabAPI"

describe("GitLab discussion request payloads", () => {
  const host = "https://gitlab.example.com"
  const discussionsPath = "/api/v4/projects/group%2Fproject/merge_requests/123/discussions"
  const body = "Large Danger comment: café 🚀 & ? = + %\n".repeat(1000)
  let api: GitLabAPI

  beforeAll(() => {
    nock.disableNetConnect()
  })

  beforeEach(() => {
    api = new GitLabAPI({ repoSlug: "group/project", pullRequestID: "123" }, { host, token: "fake-token" })
  })

  afterEach(() => {
    nock.cleanAll()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  it("creates a large discussion with text in the JSON body and no query parameters", async () => {
    const response = { id: "discussion-id", notes: [{ id: 456, body }] }
    const scope = nock(host).post(discussionsPath, { body }).reply(201, response)

    await expect(api.createMergeRequestDiscussion(body)).resolves.toEqual(response)
    expect(scope.isDone()).toBe(true)
  })

  it("updates a large discussion note with text in the JSON body and no query parameters", async () => {
    const response = { id: 456, body }
    const scope = nock(host).put(`${discussionsPath}/discussion-id/notes/456`, { body }).reply(200, response)

    await expect(api.updateMergeRequestDiscussionNote("discussion-id", 456, body)).resolves.toEqual(response)
    expect(scope.isDone()).toBe(true)
  })

  it("creates a large inline discussion with text and position in the multipart body", async () => {
    const response = { id: "discussion-id", notes: [{ id: 456, body }] }
    const scope = nock(host)
      .matchHeader("content-type", /multipart\/form-data/)
      .post(discussionsPath, (payload) => {
        const multipart = Buffer.isBuffer(payload) ? payload.toString() : String(payload)
        return (
          multipart.includes('name="body"\r\n\r\n' + body.replace(/\n/g, "\r\n")) &&
          multipart.includes('name="position[position_type]"\r\n\r\ntext') &&
          multipart.includes('name="position[new_path]"\r\n\r\nfile.ts') &&
          multipart.includes('name="position[new_line]"\r\n\r\n10')
        )
      })
      .reply(201, response)

    await expect(
      api.createMergeRequestDiscussion(body, {
        position: {
          positionType: "text",
          baseSha: "base",
          startSha: "start",
          headSha: "head",
          newPath: "file.ts",
          newLine: "10",
        },
      })
    ).resolves.toEqual(response)
    expect(scope.isDone()).toBe(true)
  })
})
