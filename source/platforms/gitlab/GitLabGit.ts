import { GitLabDSL } from "../../dsl/GitLabDSL"
import { gitJSONToGitDSL, GitJSONToGitDSLConfig, GitStructuredDiff } from "../git/gitJSONToGitDSL"
export const gitLabGitDSL = (gitlab: GitLabDSL, json: GitJSONDSL): GitDSL => {
    // TODO: implement me when the API methods are in
    getFullDiff: async (): Promise<string> => {
      throw new Error("getFullDiff is not yet implemented")
    },
    // TODO: implement me when the API methods are in
    getStructuredDiffForFile: async (): Promise<GitStructuredDiff> => {
      throw new Error("getStructuredDiffForFile is not yet implemented")