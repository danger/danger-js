// @flow
/*eslint-disable */

import { GitHub } from "../GitHub"
import Fake from "../../ci_source/Fake"
import { readFileSync } from "fs"
import { resolve } from "path"
import os from "os"
import type { GitDSL } from "../../dsl/GitDSL"
const fixtures = resolve(__dirname, "fixtures")
const EOL = os.EOL

// Gets a mocked out GitHub class for checking a get path
const mockGitHubWithGetForPath = (expectedPath): GitHub => {
  const mockSource = new Fake({})
  const github = new GitHub("Token", mockSource)

  // $FlowFixMe: Ignore an error from setting an unexistant func
  github.get = (path: string, headers: any = {}, body: any = {}, method: string = "GET"): Promise < any > => {
    return new Promise((resolve: any, reject: any) => {
      expect(path).toBe(expectedPath)
      resolve({})
    })
  }

  return github
}

/** Returns JSON from the fixtured dir */
const requestWithFixturedJSON = (path: string): Promise <Response> => {
  const json = JSON.parse(readFileSync(`${fixtures}/${path}`, {}).toString())
  return () => { return {
    json: () => Promise.resolve(json)
  } }
}

/** Returns arbitrary text value from a request */
const requestWithFixturedContent = (path: string): Promise <Response> => {
  const content = readFileSync(`${fixtures}/${path}`, {}).toString()
  return () => { return {
    text: () => Promise.resolve(content)
  } }
}

describe("API results", () => {
  it("sets the correct paths for pull request comments", () => {
    const expectedPath = "repos/artsy/emission/issues/327/comments"
    const github = mockGitHubWithGetForPath(expectedPath)
    expect(github.getPullRequestComments())
  })

  it("sets the correct paths for getPullRequestDiff", () => {
    const expectedPath = "repos/artsy/emission/pulls/327"
    const github = mockGitHubWithGetForPath(expectedPath)
    expect(github.getPullRequestDiff())
  })
})

describe("with fixtured data", () => {
  it("returns the correct github data", async () => {
    const mockSource = new Fake({})
    const github:Platform = new GitHub("Token", mockSource)
    github.getPullRequestInfo = requestWithFixturedJSON("github_pr.json")

    const info = await github.getReviewInfo()
    expect(info.title).toEqual("Adds support for showing the metadata and trending Artists to a Gene VC")
  })

  describe("the dangerfile gitDSL", () => {
    let github = {}
    beforeEach(() => {
      github = new GitHub("Token", new Fake({}))
      github.getPullRequestDiff = requestWithFixturedContent("github_diff.diff")
    })

    it("sets the modified/created/deleted", async () => {
      const gitDSL:GitDSL = await github.getReviewDiff()

      expect(gitDSL.modified_files).toEqual(["CHANGELOG.md", "data/schema.graphql", "data/schema.json", "externals/metaphysics", "lib/__mocks__/react-relay.js", "lib/components/artist/about.js", "lib/components/gene/header.js", "lib/containers/__tests__/__snapshots__/gene-tests.js.snap", "lib/containers/__tests__/gene-tests.js", "lib/containers/gene.js", "tsconfig.json"])

      expect(gitDSL.created_files).toEqual(["lib/components/gene/about.js", "lib/components/gene/biography.js", "lib/components/related_artists/index.js", "lib/components/related_artists/related_artist.js"])

      expect(gitDSL.deleted_files).toEqual(["lib/components/artist/related_artists/index.js", "lib/components/artist/related_artists/related_artist.js", "lib/components/gene/about_gene.js"])
    })

    // sorry windows users - I guess this test will fail for you
    it("shows the diff for a specific file", async () => {
      const expected = ` - [dev] Updates Flow to 0.32 - orta${EOL} - [dev] Updates React to 0.34 - orta${EOL} - [dev] Turns on \"keychain sharing\" to fix a keychain bug in sim - orta${EOL}+- GeneVC now shows about information, and trending artists - orta${EOL} ${EOL} ### 1.1.0-beta.2${EOL} `;
      const gitDSL:GitDSL = await github.getReviewDiff()

      expect(gitDSL.diffForFile("CHANGELOG.md")).toEqual(expected)
    })
  })
})
