// @flow
// This file represents the module that is exposed as the danger API
import "babel-polyfill"

type GitDSL = {
  modified_files: string[],
  created_files: string[],
  deleted_files: string[]
}

type DangerDSL = {
  git: GitDSL
}

/** Fails the build */
export function fail(message: string) {
}

export const danger: DangerDSL = {
  git: {
    modified_files: ["hello world"],
    created_files: ["other file"],
    deleted_files: ["last file"]
  }
}
