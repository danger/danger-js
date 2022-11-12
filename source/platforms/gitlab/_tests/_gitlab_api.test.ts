/* eslint-disable @typescript-eslint/ban-ts-comment */
import nock, { Definition } from "nock"
import { default as GitLabAPI, getGitLabAPICredentialsFromEnv } from "../GitLabAPI"
import { resolve } from "path"
import { readFileSync } from "fs"

const nockBack = nock.back
nockBack.fixtures = __dirname + "/fixtures"

// We're testing https://gitlab.com/gitlab-org/gitlab-foss/merge_requests/27117
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
      { pullRequestID: "27117", repoSlug: "gitlab-org/gitlab-foss" },
      getGitLabAPICredentialsFromEnv({
        DANGER_GITLAB_HOST: "gitlab.com",
        DANGER_GITLAB_API_TOKEN: "FAKE_DANGER_GITLAB_API_TOKEN",
      })
    )
  })

  it("configures host from CI_API_V4_URL", () => {
    api = new GitLabAPI(
      { pullRequestID: "27117", repoSlug: "gitlab-org/gitlab-foss" },
      getGitLabAPICredentialsFromEnv({
        CI_API_V4_URL: "https://testciapiv4url.com/api/v4",
        DANGER_GITLAB_API_TOKEN: "FAKE_DANGER_GITLAB_API_TOKEN",
      })
    )

    expect(api.projectURL).toBe("https://testciapiv4url.com/gitlab-org/gitlab-foss")
  })

  it("projectURL is defined", () => {
    expect(api.projectURL).toBe("https://gitlab.com/gitlab-org/gitlab-foss")
  })

  it("mergeRequestURL is defined", () => {
    expect(api.mergeRequestURL).toBe("https://gitlab.com/gitlab-org/gitlab-foss/merge_requests/27117")
  })

  const sanitizeUserResponse = (nocks: Definition[]): Definition[] => {
    return nocks.map((nock: Definition) => {
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

  it("getMergeRequestApprovals", async () => {
    const { nockDone } = await nockBack("getMergeRequestApprovals.json")
    const result = await api.getMergeRequestApprovals()
    nockDone()
    const { response } = loadFixture("getMergeRequestApprovals")
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

  it("getMergeRequestDiscussions", async () => {
    const { nockDone } = await nockBack("getMergeRequestDiscussions.json")
    const result = await api.getMergeRequestDiscussions()
    nockDone()
    const { response } = loadFixture("getMergeRequestDiscussions")
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

  it("getCompareChanges", async () => {
    const { nockDone } = await nockBack("getCompareChanges.json")
    const result = await api.getCompareChanges(
      "50cd5d9b776848cf23f1fd1ec52789dbdf946185",
      "28531ab43666b5fdf37e0a70db3bcbf7d3f92183"
    )
    nockDone()
    const { response } = loadFixture("getCompareChanges")
    expect(result).toEqual(response.diffs)
  })

  it("getCompareChanges without base/head", async () => {
    const { nockDone } = await nockBack("getMergeRequestChanges.json")
    const result = await api.getCompareChanges()
    nockDone()
    const { response } = loadFixture("getCompareChanges")
    expect(result).toEqual(response.diffs)
  })

  it("getFileContents", async () => {
    const { nockDone } = await nockBack("getFileContents.json")
    const parameters: { filePath: string; ref: string; expected: string }[] = [
      {
        filePath: "Gemfile",
        ref: "master",
        expected: "source 'https://rubygems.org'",
      },
      {
        filePath: "FileNotExist",
        ref: "master",
        expected: "",
      },
    ]
    for (let el of parameters) {
      let result = await api.getFileContents(el.filePath, api.repoMetadata.repoSlug, el.ref)
      expect(result).toContain(el.expected)
    }
    nockDone()
  })

  it("updateMergeRequestInfo", async () => {
    const { nockDone } = await nockBack("updateMergeRequestInfo.json")
    const titleToUpdate = "update merge request"
    const result = await api.updateMergeRequestInfo({ title: titleToUpdate })
    nockDone()
    expect(JSON.stringify(result)).toContain(titleToUpdate)
  })

  describe("updateMergeRequestInfo (add|remove)labels", () => {
    let nockDone: { nockDone: () => void }

    afterAll(async () => {
      nockDone.nockDone()
    })

    it("addLabels", async () => {
      nockDone = await nockBack("updateMergeRequestInfo.json")
      const result = await api.addLabels("first-label", "second-label")
      expect(result).toBeTruthy()
    })

    it("removeLabels", async () => {
      nockDone = await nockBack("updateMergeRequestInfo.json")
      const result = await api.removeLabels("remove-me-label")
      expect(result).toBeTruthy()
    })

    it("addLabels with no duplicates", async () => {
      nockDone = await nockBack("updateMergeRequestInfo.json")
      const result = await api.addLabels("danger-bot", "new-label")
      expect(result).toBeTruthy()
    })
  })
})
