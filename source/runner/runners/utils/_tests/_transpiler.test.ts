jest.mock("fs", () => ({
  readFileSync: jest.fn(),
  existsSync: jest.fn(),
}))
jest.mock("path", () => {
  const path = jest.requireActual("path")
  return { ...path, resolve: jest.fn(path.resolve) }
})

import { typescriptify, lookupTSConfig, dirContains } from "../transpiler"
import * as fs from "fs"
import * as path from "path"

describe("typescriptify", () => {
  it("removes the module option in a tsconfig ", () => {
    const dangerfile = `import {a} from 'lodash'; a()`
    const fakeTSConfig = {
      compilerOptions: {
        target: "es5",
        module: "es2015",
      },
    }
    const fsMock = fs.readFileSync as jest.Mock
    fsMock.mockImplementationOnce(() => JSON.stringify(fakeTSConfig))

    expect(typescriptify(dangerfile, "/a/b")).not.toContain("import")
  })
})

describe("lookupTSConfig", () => {
  function setup(cwd: string, configDir: string) {
    // mock path.resolve to be relative to cwd
    const actualPath = jest.requireActual("path") as typeof path
    const resolve = path.resolve as jest.Mock
    resolve.mockImplementation((p: string = "") => actualPath.resolve(cwd, p))

    const existsSync = fs.existsSync as jest.Mock
    const tsconfigPath = path.resolve(path.join(configDir, "tsconfig.json"))
    existsSync.mockImplementation((f: string) => path.resolve(f) === tsconfigPath)
  }

  it("can find in the same folder as dangerfile", () => {
    setup("/a", "/c")
    expect(lookupTSConfig("/c")).toBe("/c/tsconfig.json")
  })

  it("can find in a parent folder", () => {
    setup("/a", "/a/b")
    expect(lookupTSConfig("./b/c")).toBe("/a/b/tsconfig.json")
  })

  it("can find in the working dir", () => {
    setup("/a", "/a")
    expect(lookupTSConfig("/c")).toBe("tsconfig.json")
  })

  it("cannot find in a directory higher than current", () => {
    setup("/a/b", "/a")
    expect(lookupTSConfig("/a/b/c")).toBe(null)
  })
})

describe("dirContains", () => {
  it("identifies what directory contains", () => {
    expect(dirContains("/a", "/a/b")).toBe(true)
    expect(dirContains("/a/b", "/a")).toBe(false)
    expect(dirContains("/a", "/a")).toBe(true)
  })
})
