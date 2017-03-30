import utils from "../GitHubUtils"

import { readFileSync } from "fs"
import { resolve } from "path"

const fixtures = resolve(__dirname, "..", "..", "_tests", "fixtures")
const fixuredData = (path) => JSON.parse(readFileSync(`${fixtures}/${path}`, {}).toString())
const pr = fixuredData("github_pr.json")

describe("fileLinks", () => {
  it("Should convert a few paths into links", () => {
    const sut = utils(pr)
    const links = sut.fileLinks(["a/b/c", "d/e/f"])
    expect(links).toEqual('<a href="https://github.com/artsy/emission/blob/genevc/a/b/c">c</a> and <a href="https://github.com/artsy/emission/blob/genevc/d/e/f">f</a>') //tslint:disable-line:max-line-length
  })

  it("Should convert a few paths into links showing full links", () => {
    const sut = utils(pr)
    const links = sut.fileLinks(["a/b/c", "d/e/f"], false)
    expect(links).toEqual('<a href="https://github.com/artsy/emission/blob/genevc/a/b/c">a/b/c</a> and <a href="https://github.com/artsy/emission/blob/genevc/d/e/f">d/e/f</a>') //tslint:disable-line:max-line-length
  })

  it("Should convert a few paths into links showing full link on a custom fork/branch", () => {
    const sut = utils(pr)
    const links = sut.fileLinks(["a/b/c", "d/e/f"], false, "orta/emission", "new")
    expect(links).toEqual('<a href="https://github.com/orta/emission/blob/new/a/b/c">a/b/c</a> and <a href="https://github.com/orta/emission/blob/new/d/e/f">d/e/f</a>') //tslint:disable-line:max-line-length
  })
})
