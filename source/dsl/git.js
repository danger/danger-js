// @flow
"use strict"

export interface GitDSL {
  modified_files: string[],
  created_files: string[],
  deleted_files: string[]
}

