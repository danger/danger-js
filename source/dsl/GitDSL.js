// @flow
"use strict"

export interface GitDSL {
  /**
   * Filepaths with changes relative to the git root
   * @type {string[]}
   */
  modified_files: string[],
  /**
   * Newly created filepaths relative to the git root
   * @type {string[]}
   */
  created_files: string[],
  /**
   * Removed filepaths relative to the git root
   * @type {string[]}
   */
  deleted_files: string[]
}

