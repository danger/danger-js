// @flow
// This file represents the module that is exposed as the danger API

type DangerGit = {
  modified_files: string[],
  created_files: string[],
  deleted_files: string[]
}

type DangerDSL = {
  git: DangerGit
}

const danger: DangerDSL = {
  git: {
    modified_files: ["hello world"],
    created_files: ["other file"],
    deleted_files: ["last file"]
  }
}

export default danger
