---
title: Danger + BitBucket Server
subtitle: Dangerous bits
layout: guide_js
order: 4
blurb: Some examples of Danger with BitBucket Server
---

To use Danger JS with BitBucket Server: you'll need to create a new account for Danger to use,
then set the following environment variables on your CI:

* `DANGER_BITBUCKETSERVER_HOST` = The root URL for your server, e.g. `https://bitbucket.mycompany.com`.
* `DANGER_BITBUCKETSERVER_USERNAME` = The username for the account used to comment.
* `DANGER_BITBUCKETSERVER_PASSWORD` = The password for the account used to comment.

Then you will have a fully fleshed out `danger.bitbucket_server` object in your Dangerfile to work with,
for example:

```ts
import { danger, warn } from "danger"

if (danger.bitbucket_server.pr.title.includes("WIP")) {
  warn("PR is considered WIP")
}
```

The DSL is fully fleshed out, you can see all the details inside the [Danger JS Reference][ref],
but the summary is:

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
