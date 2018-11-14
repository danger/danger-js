---
title: Danger + BitBucket Server
subtitle: Dangerous bits
layout: guide_js
order: 4
blurb: An overview of using Danger with BitBucket Server, and some examples
---

To use Danger JS with BitBucket Server: you'll need to create a new account for Danger to use, then set the following
environment variables on your CI:

- `DANGER_BITBUCKETSERVER_HOST` = The root URL for your server, e.g. `https://bitbucket.mycompany.com`.
- `DANGER_BITBUCKETSERVER_USERNAME` = The username for the account used to comment.

Also you need to set password or
[personal access token](https://confluence.atlassian.com/bitbucketserver/personal-access-tokens-939515499.html) by
environment variables:

- `DANGER_BITBUCKETSERVER_PASSWORD` = The password for the account used to comment.
- `DANGER_BITBUCKETSERVER_TOKEN` = The personal access token for the account used to comment.

Then in your Dangerfiles you will have a fully fleshed out `danger.bitbucket_server` object to work with. For example:

```ts
import { danger, warn } from "danger"

if (danger.bitbucket_server.pr.title.includes("WIP")) {
  warn("PR is considered WIP")
}
```

The DSL is expansive, you can see all the details inside the [Danger JS Reference][ref], but the TLDR is:

```ts
danger.bitbucket_server.

  /** The pull request and repository metadata */
  metadata: RepoMetaData
  /** The related JIRA issues */
  issues: JIRAIssue[]
  /** The PR metadata */
  pr: BitBucketServerPRDSL
  /** The commits associated with the pull request */
  commits: BitBucketServerCommit[]
  /** The comments on the pull request */
  comments: BitBucketServerPRActivity[]
  /** The activities such as OPENING, CLOSING, MERGING or UPDATING a pull request */
  activities: BitBucketServerPRActivity[]
```

Here are some example rules using the DSL:

```ts
import { danger, warn } from "danger"

const bbs = danger.bitbucket_server

// Ensure a PR has assigned Jira issues
if (bbs.issues.length === 0) {
  warn("This PR does not have any assigned Jira issues.")
}

// Make a warning if there are changes to a package.json but that a
// user called murphdog hasn't yet weighed in that the changes are fine.
const hasPackageChanges = danger.git.modified_files.includes("package.json")
const hasMurphDogApproval = bbs.comments.find(
  c => c.user.slug == "murphdog" && !!c.comment && c.comment.text.includes(":+1:")
)
if (hasPackageChanges && !hasMurphDogApproval) {
  warn("This PR has `package.json` changes, but @murphdog hasn't approved them yet.")
}

// Enforce team "fun"
const hasGIF = bbs.pr.description.includes(".gif")
if (hasGIF) {
  fail("This PR needs a GIF.")
}
```

Plus any other example you can find that uses GitHub, will probably work in BitBucket Server, with a bit of DSL
translation.

Our BitBucket Server support is still pretty new, so we'd love to see improvements and PRs to help make it work for
everyone.

In addition, it is possible to specify a proxy to be used for the requests using environmental variables. This is useful
for debugging:

```ts
export NODE_TLS_REJECT_UNAUTHORIZED=0 # Avoid certificate error

export http_proxy=http://127.0.0.1:8080
or
export https_proxy=https://127.0.0.1:8080
```
