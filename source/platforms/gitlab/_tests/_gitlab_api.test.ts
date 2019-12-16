import nock, { NockDefinition } from "nock"
import { default as GitLabAPI, getGitLabAPICredentialsFromEnv } from "../GitLabAPI"
import { resolve } from "path"
import { readFileSync } from "fs"

const nockBack = nock.back
nockBack.fixtures = __dirname + "/fixtures"

// We're testing https://gitlab.com/gitlab-org/gitlab-ce/merge_requests/27117
// This has been chosen because it is already merged and publicly available, it's unlikely to change

/** Returns a fixture. */
const loadFixture = (path: string): any =>
  JSON.parse(readFileSync(resolve(nockBack.fixtures, `${path}.json`), {}).toString())[0]

describe("GitLab API", () => {
  let api: GitLabAPI

  beforeAll(() => {
    nock.recorder.rec()
    nockBack.setMode("record")
  })

  afterAll(() => {
    nock.restore()
  })

  beforeEach(() => {
    api = new GitLabAPI(
      { pullRequestID: "27117", repoSlug: "gitlab-org/gitlab-ce" },
      getGitLabAPICredentialsFromEnv({
        DANGER_GITLAB_HOST: "gitlab.com",
        DANGER_GITLAB_API_TOKEN: "FAKE_DANGER_GITLAB_API_TOKEN",
      })
    )
  })

  it("configures host from CI_API_V4_URL", () => {
    api = new GitLabAPI(
      { pullRequestID: "27117", repoSlug: "gitlab-org/gitlab-ce" },
      getGitLabAPICredentialsFromEnv({
        CI_API_V4_URL: "https://testciapiv4url.com/api/v4",
        DANGER_GITLAB_API_TOKEN: "FAKE_DANGER_GITLAB_API_TOKEN",
      })
    )

    expect(api.projectURL).toBe("https://testciapiv4url.com/gitlab-org/gitlab-ce")
  })

  it("projectURL is defined", () => {
    expect(api.projectURL).toBe("https://gitlab.com/gitlab-org/gitlab-ce")
  })

  it("mergeRequestURL is defined", () => {
    expect(api.mergeRequestURL).toBe("https://gitlab.com/gitlab-org/gitlab-ce/merge_requests/27117")
  })

  const sanitizeUserResponse = (nocks: NockDefinition[]): NockDefinition[] => {
    return nocks.map((nock: NockDefinition) => {
      let { response, ...restNock } = nock

      // @ts-ignore
      const { identities } = response

      response = {
        // @ts-ignore
        ...response,
        username: "username",
        name: "First Last",
        organization: "My Organization",
        email: "username@example.com",
        avatar_url: "https://www.",
        web_url: "https://www.",
        identities: identities.map(({ extern_uid, ...rest }: any) => ({ ...rest, extern_uid: "xxxx" })),
      }

      return { ...restNock, response }
    })
  }

  it("getUser returns the current user profile id", async () => {
    // To re-record this you need to provide a valid DANGER_GITLAB_API_TOKEN

    const { nockDone } = await nockBack("getUser.json", { afterRecord: sanitizeUserResponse })
    const result = await api.getUser()
    nockDone()
    const { response } = loadFixture("getUser")
    expect(result).toEqual(response)
  })

  it("getMergeRequestInfo", async () => {
    const { nockDone } = await nockBack("getMergeRequestInfo.json")
    const result = await api.getMergeRequestInfo()
    nockDone()
    const { response } = loadFixture("getMergeRequestInfo")
    expect(result).toEqual(response)
  })

  it("getMergeRequestChanges", async () => {
    const { nockDone } = await nockBack("getMergeRequestChanges.json")
    const result = await api.getMergeRequestChanges()
    nockDone()
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          old_path: expect.any(String),
          new_path: expect.any(String),
          a_mode: expect.any(String),
          b_mode: expect.any(String),
          diff: expect.any(String),
          new_file: expect.any(Boolean),
          deleted_file: expect.any(Boolean),
        }),
      ])
    )
  })

  it("getMergeRequestCommits", async () => {
    const { nockDone } = await nockBack("getMergeRequestCommits.json")
    const result = await api.getMergeRequestCommits()
    nockDone()
    const { response } = loadFixture("getMergeRequestCommits")
    expect(result).toEqual(response)
  })

  it("getMergeRequestNotes", async () => {
    const { nockDone } = await nockBack("getMergeRequestNotes.json")
    const result = await api.getMergeRequestNotes()
    nockDone()
    const { response } = loadFixture("getMergeRequestNotes")
    expect(result).toEqual(response)
  })

  it("getMergeRequestInlineNotes", async () => {
    const { nockDone } = await nockBack("getMergeRequestInlineNotes.json")
    const result = await api.getMergeRequestInlineNotes()
    nockDone()
    // TODO: There are no inline notes on this MR, we should look for a public one that has inline notes to improve this test
    expect(result).toEqual([])
  })
})
