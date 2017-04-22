---
title: FAQ
subtitle: Frequently Asked Questions
layout: guide_js
order: 3
---

## Can Danger comment inside a file on an PR?

Not yet, but there is a lot of discussion on [danger-js#77][77].

## Can I use the same Dangerfile across many repos?

Ish, it's currently quite complex to set up, but work is on-going on [Danger/Peril][peril]. This is a hosted version of Danger which does not need to run on CI. Using Peril you can use Dangerfiles to reply to basically any github webhook type.

## I want to help influence Danger's direction

We'd recommend first becoming acquainted with the [VISION.md][] inside Danger, this is the long-term plan. Then there are two ways to start contributing today:

 * Opinions are extra welcome on issues marked as [Open For Discussion][open].
 
 * Well defined work items like features or fixes are marked as [You Can Do This][you-can-do-this].

We keep comments in the public domain, there is a Slack, but it's very rarely used. If you're interested in joining, you can DM [orta][].

[77]: https://github.com/danger/danger-js/issues/77
[VISION.md]: https://github.com/danger/danger-js/blob/master/VISION.md
[open]: https://github.com/danger/danger-js/issues?q=is%3Aissue+is%3Aopen+label%3A%22Open+for+Discussion%22
[you-can-do-this]: https://github.com/danger/danger-js/issues?q=is%3Aissue+is%3Aopen+label%3A%22You+Can+Do+This%22
[orta]: https://twitter.com/orta/
[peril]:  https://github.com/danger/peril
