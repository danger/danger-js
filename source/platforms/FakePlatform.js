// @flow
"use strict"

import type { GitDSL } from "../dsl/GitDSL"
import type { CISource } from "../ci_source/ci_source"

export default class FakePlatform {
  name: string
  ciSource: CISource

  constructor() {
    this.name = "Fake"
  }

  async getReviewInfo(): Promise<any> {

  }

  async getReviewDiff(): Promise<GitDSL> {
    return {
      modified_files: [],
      created_files: [],
      deleted_files: [],
      diffForFile: () => ""
    }
  }

  async updateOrCreateComment(newComment: string): Promise<bool> {
    return true
  }

  async createComment(comment: string): Promise<any> {
    return true
  }

  async deleteMainComment(): Promise<bool> {
    return true
  }

  async editMainComment(comment: string): Promise<bool> {
    return true
  }
}

