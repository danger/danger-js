import { bitBucketCloudRawAndDateToGitCommitAuthor } from "../BitBucketCloudGit"

describe("bitBucketCloudRawAndDateToGitCommitAuthor", () => {
  const date = "2019-05-13T11:41:13+00:00"
  it("should convert name doesn't contain space correctly", () => {
    const raw = "Foo <foo@bar.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo",
      email: "foo@bar.com",
      date,
    })
  })
  it("should convert name contains one space correctly", () => {
    const raw = "Foo Bar <foo@bar.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar",
      email: "foo@bar.com",
      date,
    })
  })
  it("should convert name contains multiple space correctly", () => {
    const raw = "Foo Bar Foo Bar Foo <foo@bar.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar Foo Bar Foo",
      email: "foo@bar.com",
      date,
    })
  })
  it("should convert name contains special characters correctly", () => {
    const raw = "Foo Bar < Foo  @Bar >Foo <foo@bar.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar < Foo  @Bar >Foo",
      email: "foo@bar.com",
      date,
    })
  })
  it("should convert email contains multiple dot correctly", () => {
    const raw = "Foo Bar <foo@bar.hello.com>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar",
      email: "foo@bar.hello.com",
      date,
    })
  })
  it("should put raw into name if it couldn't convert", () => {
    const raw = "Foo Bar"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: raw,
      email: "",
      date,
    })
  })
  it("should put only name if it couldn't find an email", () => {
    const raw = "Foo Bar <>"
    expect(bitBucketCloudRawAndDateToGitCommitAuthor(raw, date)).toEqual({
      name: "Foo Bar",
      email: "",
      date,
    })
  })
})
