---
title: Danger + BitBucket Cloud
subtitle: Dangerous bits
layout: guide_js
order: 4
blurb: An overview of using Danger with BitBucket Cloud, and some examples
---

To use Danger JS with BitBucket Cloud: you'll need to create a new account for Danger to use, then set the following
environment variables on your CI:

- `DANGER_BITBUCKETCLOUD_USERNAME` = The username for the account used to comment, as shown on
  https://bitbucket.org/account/
- `DANGER_BITBUCKETCLOUD_PASSWORD` = The password for the account used to comment, you could use
  [App passwords](https://confluence.atlassian.com/bitbucket/app-passwords-828781300.html#Apppasswords-Aboutapppasswords)
  with Read Pull Requests Permission.

We need UUID for updating comment, you can get it from the link on your home page of bitbucket.org. Then replace `%7B`
with `{` and `%7D` with `}`.

For example, the UUID of `https://bitbucket.org/%7Bzzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz%7D/` will be
`{zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz}`

- `DANGER_BITBUCKETCLOUD_UUID` = The uuid for the account used to comment.

Then in your Dangerfiles you will have a fully fleshed out `danger.bitbucket_cloud` object to work with. For example:

```ts
import { danger, warn } from "danger"

if (danger.bitbucket_cloud.pr.title.includes("WIP")) {
  warn("PR is considered WIP")
}
```

The DSL is expansive, you can see all the details inside the [Danger JS Reference][ref], but the TLDR is:

```ts
danger.bitbucket_cloud.

  /** The pull request and repository metadata */
  metadata: RepoMetaData
  /** The PR metadata */
  pr: BitBucketCloudPRDSL
  /** The commits associated with the pull request */
  commits: BitBucketCloudCommit[]
  /** The comments on the pull request */
  comments: BitBucketCloudPRComment[]
  /** The activities such as OPENING, COMMENTING, CLOSING, MERGING or UPDATING a pull request */
  activities: BitBucketCloudPRActivity[]
```
