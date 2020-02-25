import { GitLabDSL, GitLabMRChange } from "../../dsl/GitLabDSL"
import { gitJSONToGitDSL, GitJSONToGitDSLConfig } from "../git/gitJSONToGitDSL"
import GitLabAPI from "./GitLabAPI"
export const gitLabGitDSL = (gitlab: GitLabDSL, json: GitJSONDSL, gitlabAPI: GitLabAPI): GitDSL => {
    getFullDiff: async (base: string, head: string) => {
      const changes = await gitlabAPI.getCompareChanges(base, head)
      return gitlabChangesToDiff(changes)

const gitlabChangesToDiff = (changes: GitLabMRChange[]): string => {
  // Gitlab doesn't return full raw git diff, relevant issue: https://gitlab.com/gitlab-org/gitlab/issues/24913
  return changes
    .map(change => {
      return `\
diff --git a/${change.old_path} b/${change.new_path}
${change.new_file ? `new file mode ${change.b_mode}` : ""}\
${change.deleted_file ? `deleted file mode ${change.a_mode}` : ""}\
${change.renamed_file ? `rename from ${change.old_path}\nrename to ${change.new_path}` : ""}
--- ${change.new_file ? "/dev/null" : "a/" + change.old_path}
+++ ${change.deleted_file ? "/dev/null" : "b/" + change.new_path}
${change.diff}`
    })
    .join("\n")
}