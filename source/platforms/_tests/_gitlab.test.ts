import GitLabAPI from "../gitlab/GitLabAPI"
import GitLab from "../GitLab"
import type * as Types from "@gitbeaker/rest"

const baseUri = "https://my-gitlab.org/my-project"

const dangerUserId = 8797215

const getUser = async (): Promise<Types.ExpandedUserSchema> => {
  const user: Partial<Types.ExpandedUserSchema> = { id: dangerUserId }
  return user as Types.ExpandedUserSchema
}

const dangerID = "dddanger1234"
const dangerIdString = `DangerID: danger-id-${dangerID};`

function mockNote(
  id: number,
  authorId: number,
  body = "",
  resolved = false,
  type: "DiffNote" | "DiscussionNote" | null = "DiffNote"
): Types.MergeRequestNoteSchema {
  const author: Partial<Types.UserSchema> = { id: authorId }
  const note: Partial<Types.MergeRequestNoteSchema> = {
    author: author as Types.UserSchema,
    body,
    id,
    type: type,
    resolved: resolved,
  }
  return note as Types.MergeRequestNoteSchema
}

function mockSystemAutoresolveNote(id: number, authorId: number): Types.MergeRequestNoteSchema {
  let autoresolvedSystemNote = mockNote(
    id,
    authorId,
    "changed this line in [version 2 of the diff](/some/url/merge_requests/2322/diffs?diff_id=12345&start_sha=31c4ab)"
  )
  autoresolvedSystemNote.system = true
  return autoresolvedSystemNote
}

function mockDangerNote(id: number, resolved = false): Types.MergeRequestNoteSchema {
  return mockNote(id, dangerUserId, `some body ${dangerIdString} asdf`, resolved)
}

function mockDiscussion(id: string, notes: Types.DiscussionNoteSchema[]): Types.DiscussionSchema {
  const discussion: Partial<Types.DiscussionSchema> = { id, notes }
  return discussion as Types.DiscussionSchema
}

function mockApi(withExisting = false): GitLabAPI {
  const note1 = mockDangerNote(1001)
  const note2 = mockNote(1002, 125235)
  const note3 = mockNote(
    1003,
    dangerUserId,
    `Main Danger comment ${dangerIdString} More text to ensure the Danger ID string can be found in the middle of a comment`,
    false,
    null
  )
  const note4 = mockNote(1004, 745774)
  const note5 = mockNote(1005, 745774)
  const discussion1 = mockDiscussion("aaaaffff1111", [note1, note2])
  const discussion2 = mockDiscussion("aaaaffff2222", [note3, note4])
  const discussion3 = mockDiscussion("aaaaffff3333", [note5])

  const newNote = mockNote(4711, dangerUserId)
  const newDiscussion = mockDiscussion("aaaaffff0000", [newNote])

  const api: Partial<GitLabAPI> = {
    getUser,
    createMergeRequestDiscussion: jest.fn(() => Promise.resolve(newDiscussion)),
    createMergeRequestNote: jest.fn(() => Promise.resolve(newNote)),
    deleteMergeRequestNote: jest.fn(() => Promise.resolve(true)),
    getMergeRequestDiscussions: jest.fn(() =>
      Promise.resolve(withExisting ? [discussion1, discussion2, discussion3] : [])
    ),
    getMergeRequestNotes: jest.fn(() => Promise.resolve(withExisting ? [note1, note2, note3, note4, note5] : [])),
    mergeRequestURL: baseUri,
    updateMergeRequestNote: jest.fn(() => Promise.resolve(newNote)),
  }
  return api as GitLabAPI
}

describe("updateOrCreateComment", () => {
  const comment = "my new comment"

  it("create a new single comment not using threads", async () => {
    delete process.env.DANGER_GITLAB_USE_THREADS

    const api = mockApi()
    const url = await new GitLab(api as GitLabAPI).updateOrCreateComment(dangerID, comment)
    expect(url).toEqual(`${baseUri}#note_4711`)

    expect(api.getMergeRequestDiscussions).toHaveBeenCalledTimes(0)
    expect(api.deleteMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestNote).toHaveBeenCalledTimes(1)
    expect(api.createMergeRequestNote).toHaveBeenCalledWith(comment)
    expect(api.updateMergeRequestNote).toHaveBeenCalledTimes(0)
  })

  it("create a new single comment using threads", async () => {
    process.env.DANGER_GITLAB_USE_THREADS = "true"

    const api = mockApi()
    const url = await new GitLab(api as GitLabAPI).updateOrCreateComment(dangerID, comment)
    expect(url).toEqual(`${baseUri}#note_4711`)

    expect(api.getMergeRequestDiscussions).toHaveBeenCalledTimes(1)
    expect(api.deleteMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledTimes(1)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledWith(comment)
    expect(api.createMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.updateMergeRequestNote).toHaveBeenCalledTimes(0)
  })

  it("create a new thread", async () => {
    process.env.DANGER_GITLAB_USE_THREADS = "true"

    const api = mockApi()
    const url = await new GitLab(api as GitLabAPI).updateOrCreateComment(dangerID, comment)
    expect(url).toEqual(`${baseUri}#note_4711`)

    expect(api.getMergeRequestDiscussions).toHaveBeenCalledTimes(1)
    expect(api.deleteMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledTimes(1)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledWith(comment)
    expect(api.createMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.updateMergeRequestNote).toHaveBeenCalledTimes(0)
  })

  it("update an existing main note", async () => {
    delete process.env.DANGER_GITLAB_USE_THREADS

    const api = mockApi(true)
    const url = await new GitLab(api as GitLabAPI).updateOrCreateComment(dangerID, comment)
    expect(url).toEqual(`${baseUri}#note_4711`)

    expect(api.getMergeRequestNotes).toHaveBeenCalledTimes(1)
    expect(api.deleteMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.updateMergeRequestNote).toHaveBeenCalledTimes(1)
    expect(api.updateMergeRequestNote).toHaveBeenCalledWith(1003, comment)
  })

  it("update an existing main thread", async () => {
    process.env.DANGER_GITLAB_USE_THREADS = "true"

    const api = mockApi(true)
    const url = await new GitLab(api as GitLabAPI).updateOrCreateComment(dangerID, comment)
    expect(url).toEqual(`${baseUri}#note_4711`)

    expect(api.getMergeRequestDiscussions).toHaveBeenCalledTimes(1)
    expect(api.deleteMergeRequestNote).toHaveBeenCalledTimes(2)
    expect(api.deleteMergeRequestNote).toHaveBeenNthCalledWith(1, 1003)
    expect(api.deleteMergeRequestNote).toHaveBeenNthCalledWith(2, 1004)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.updateMergeRequestNote).toHaveBeenCalledTimes(1)
    expect(api.updateMergeRequestNote).toHaveBeenCalledWith(1001, comment)
  })
})

describe("deleteMainComment", () => {
  it("delete nothing", async () => {
    const api = mockApi()
    const result = await new GitLab(api as GitLabAPI).deleteMainComment(dangerID)
    expect(result).toEqual(false)

    expect(api.getMergeRequestDiscussions).toHaveBeenCalledTimes(1)
    expect(api.deleteMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.updateMergeRequestNote).toHaveBeenCalledTimes(0)
  })

  it("delete all danger attached notes not using threads", async () => {
    delete process.env.DANGER_GITLAB_USE_THREADS

    const api = mockApi(true)
    const result = await new GitLab(api as GitLabAPI).deleteMainComment(dangerID)
    expect(result).toEqual(true)

    expect(api.getMergeRequestNotes).toHaveBeenCalledTimes(1)
    expect(api.deleteMergeRequestNote).toHaveBeenCalledTimes(1)
    expect(api.deleteMergeRequestNote).toHaveBeenNthCalledWith(1, 1003)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.updateMergeRequestNote).toHaveBeenCalledTimes(0)
  })

  it("delete all danger attached notes using threads", async () => {
    process.env.DANGER_GITLAB_USE_THREADS = "true"

    const api = mockApi(true)
    const result = await new GitLab(api as GitLabAPI).deleteMainComment(dangerID)
    expect(result).toEqual(true)

    expect(api.getMergeRequestDiscussions).toHaveBeenCalledTimes(1)
    expect(api.deleteMergeRequestNote).toHaveBeenCalledTimes(4)
    expect(api.deleteMergeRequestNote).toHaveBeenNthCalledWith(1, 1001)
    expect(api.deleteMergeRequestNote).toHaveBeenNthCalledWith(2, 1002)
    expect(api.deleteMergeRequestNote).toHaveBeenNthCalledWith(3, 1003)
    expect(api.deleteMergeRequestNote).toHaveBeenNthCalledWith(4, 1004)
    expect(api.createMergeRequestDiscussion).toHaveBeenCalledTimes(0)
    expect(api.createMergeRequestNote).toHaveBeenCalledTimes(0)
    expect(api.updateMergeRequestNote).toHaveBeenCalledTimes(0)
  })
})

describe("getInlineComments", () => {
  it("getInlineComments returns not autoresolved danger discussions", async () => {
    const autoresolvedDangerNote = mockDangerNote(2000, true)
    const autoresolveSystemNote1 = mockSystemAutoresolveNote(2001, 12345)
    const autoresolvedDiscussion = mockDiscussion("autoresolvedDiscussion", [
      autoresolvedDangerNote,
      autoresolveSystemNote1,
    ])

    const notAutoresolvedDangerNote = mockDangerNote(2001)
    const autoresolveSystemNote2 = mockSystemAutoresolveNote(2002, 12345)
    const notAutoresolvedDiscussion = mockDiscussion("notAutoresolvedDiscussion", [
      notAutoresolvedDangerNote,
      autoresolveSystemNote2,
    ])

    const notDangerNote = mockNote(2002, 12345)
    const notDangerDiscussionNote = mockNote(2003, 23456, "", false, "DiscussionNote")
    const notDangerDiscussion = mockDiscussion("notDangerDiscussion", [notDangerNote, notDangerDiscussionNote])

    const api = mockApi()
    api.getMergeRequestDiscussions = jest.fn(() =>
      Promise.resolve([autoresolvedDiscussion, notAutoresolvedDiscussion, notDangerDiscussion])
    )
    const result = await new GitLab(api as GitLabAPI).getInlineComments(dangerID)
    expect(result).toMatchObject([{ id: "2001" }])
    expect(api.getMergeRequestDiscussions).toHaveBeenCalledTimes(1)
  })
})
