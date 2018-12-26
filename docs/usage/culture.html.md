---
title: Cultural Changes
subtitle: Cultural Changes
layout: guide_js
order: 2
blurb:
  Discussing introducing Danger into a team, how you can use it to provide positive feedback and encourage adoption of
  new rules.
---

## Introducing Danger

It can be easy to try and jump straight from no Dangerfile to a 200 line complex set of cultural rules. We'd advise
against introducing a long list of rules for Danger all at once. In our experience, gradual integration works better.
The entire team may have agreed on the changes, but slower adoption has worked better for teams new to working with
Danger.

At Artsy we've found that first just integrating Danger with a single simple rule (like checking for a CHANGELOG entry)
then starting to introduce complexity piece-meal. Encouraging different contributors to make the changes has made it
easier to go from "Ah, we shouldn't do that again" to "Oh, we could make a Danger rule for that" to "Here's the PR".

That is your end goal, making it so that everyone feels like it's easy to add and amend the rules as a project evolves.
Making dramatic changes erodes that feeling, making regular small ones improves it.

## Phrasing

One of Danger's greatest features is that it can free individuals up on the team to stop being "the person who always
requests more tests" on a PR. By moving a lot of the rote tasks in code review to a machine, you free up some mental
space to concentrate on more important things. One of the downsides is that it is impossible to provide the same level
of nuance in how you provide feedback.

You should use Danger to provide impartial feedback. Consider how these messages come across:

- You have not added a CHANGELOG entry.
- There isn't a CHANGELOG entry.
- No CHANGELOG entry.
- This PR does not include a CHANGELOG entry.

The first feels like a statement that someone has intentionally done something wrong, and Danger has caught them in the
act.

The second aims to feel a like like a testing framework telling you "Test Suites: 104 passed, 2 failures".

The third if done consistently can work out well. Terse entries can work well when you have a large series of rules, as
it feels like a check list to do.

The fourth is what we generally try to aim for, an impartial but polite mention about the state of submitted PR.

You can find what fits for you and your team, but being blameless in your messaging is one way to ensure that someone's
first and 500th interaction is still great.

## Positive Rules

Danger doesn't have to be used to provide a checklist of TODOs which have to be done. You can make rules that celebrate
achievements, for example:

- Submit congratulations when your app has had a version bump.
- Thank the author for reducing the dependency tree.
- Highlighting when someone has removed more code than adding it.
- If there are notably tricky areas of the codebase, pass along a thumbs up for daring to improve it.

There's aren't contrived either - I've seen variations on all of these rules inside Dangerfiles.
