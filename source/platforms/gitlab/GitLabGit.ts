import { debug } from "../../debug"
import { GitLabDSL, GitLabMRChange } from "../../dsl/GitLabDSL"
import { GitDSL, GitJSONDSL } from "../../dsl/GitDSL"
import { gitJSONToGitDSL, GitJSONToGitDSLConfig } from "../git/gitJSONToGitDSL"
import GitLabAPI from "./GitLabAPI"

const d = debug("GitLabGit")

export const gitLabGitDSL = (gitlab: GitLabDSL, json: GitJSONDSL, gitlabAPI: GitLabAPI): GitDSL => {
  const config: GitJSONToGitDSLConfig = {
    repo: `${gitlab.mr.project_id}`, // we don't get the repo slug, but `project_id` is equivalent in API calls
    baseSHA: gitlab.mr.diff_refs ? gitlab.mr.diff_refs.base_sha : "",
    headSHA: gitlab.mr.diff_refs ? gitlab.mr.diff_refs.head_sha : "",
    getFileContents: gitlab.utils.fileContents,
    getFullDiff: async (base: string, head: string) => {
      const changes = await gitlabAPI.getCompareChanges(base, head)
      return gitlabChangesToDiff(changes)
    },
  }

  d("Setting up git DSL with: ", config)
  return gitJSONToGitDSL(json, config)
}

export const gitlabChangesToDiff = (changes: GitLabMRChange[]): string => {
  d("Converting GitLab Changes to Diff")
  // Gitlab doesn't return full raw git diff, relevant issue: https://gitlab.com/gitlab-org/gitlab/issues/24913
  return changes
    .map((change) => {
      const { diff } = change
      if (diff.startsWith("diff --git a/") || diff.startsWith("--- a/") || diff.startsWith("--- /dev/null")) {
        return diff
      }

      return `\
diff --git a/${change.old_path} b/${change.new_path}
${change.new_file ? `new file mode ${change.b_mode}` : ""}\
${change.deleted_file ? `deleted file mode ${change.a_mode}` : ""}\
${change.renamed_file ? `rename from ${change.old_path}\nrename to ${change.new_path}` : ""}
--- ${change.new_file ? "/dev/null" : "a/" + change.old_path}
+++ ${change.deleted_file ? "/dev/null" : "b/" + change.new_path}
${diff}`
    })
    .join("\n")
}
