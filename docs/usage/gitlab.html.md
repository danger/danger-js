---
title: Danger + GitLab
subtitle: Self-Hosted
layout: guide_js
order: 4
blurb: An overview of using Danger with GitLab, and some examples
---

To use Danger JS with GitLab: you'll need to create a new account for Danger to use, then set the following environment
variable on your CI system:

- `DANGER_GITLAB_API_TOKEN` = An access token for the account which will post comments

If you are using a GitLab version prior to 11.7 you will also need to define the following environment variable:

- `DANGER_GITLAB_HOST` = Defaults to `https://gitlab.com` but you can use it for your own url

Then in your Dangerfiles you will have a fully fleshed out `danger.gitlab` object to work with. For example:

```ts
import { danger, warn } from "danger"

if (danger.gitlab.mr.title.includes("WIP")) {
  warn("PR is considered WIP")
}
```

The DSL is expansive, you can see all the details inside the [Danger JS Reference][ref], but the TLDR is:

```ts
danger.gitlab.
  /** The pull request and repository metadata */
  metadata: RepoMetaData
  /** The Merge Request metadata */
  mr: GitLabMR
  /** The commits associated with the merge request */
  commits: GitLabMRCommit[]
```
