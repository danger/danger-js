# Danger for JS

Danger JS is a tool to creating complex per-project rules, and messages in Code Review. One of it's key aims is to be
able to run on a server, and not need direct access to the filesystem to do its work.

It was started in mid-2016, and has fleshed out into a considerable set of useful tools.

- You can get started in a fun way via `danger init`.
- You can run danger via `danger ci`.
- You can fake running on CI locally for any GitHub PR with `danger pr`.
- You can run Danger rules inside git hooks, or without pull requests metadata via `danger local`.
- You can share code using [danger plugins][plugins].
- Danger can run independently of CI via Peril.

## Future Plans

There is only really one big target left for the future of Danger JS:

- GitLab

I don't plan on really using this, so I expect both to come from the community instead.

My focus is going to be mainly in the Peril side of Danger. Moving to making it trivial to add Danger to any GitHub
project and really unlocking some complex culture systems. Examples of these can be found on [the Artsy blog][peril].

# Why Danger JS? What about Danger Ruby?

When I started Danger JS, Danger Ruby was two years old, is still doing just fine. See the
[original vision file](https://github.com/danger/danger/blob/master/VISION.md). This document assumes you have read it.

The amount of issues we get in comparison to the number of downloads on Rubygems makes me feel pretty confident about
Danger Ruby's state of production quality and maturity. I wanted to start thinking about the larger patterns in
software, because at Artsy, we are starting to use JavaScript in
[for many teams](http://artsy.github.io/blog/2016/08/15/React-Native-at-Artsy/).

I've explored [running JavaScript](https://github.com/danger/danger/pull/423) from the ruby Danger,
([example](https://github.com/artsy/emission/blob/d58b3d57bf41100e3cce3c2c1b1c4d6c19581a68/Dangerfile.js) from
production) but this pattern isn't going to work on the larger scale: You cannot use npm modules, nor work with
babel/tsc to transpile your `Dangerfile.js` and the requirements on the integrating project
[feel weird](https://github.com/artsy/emission/pull/233). Running JS in Ruby isn't going to work for me.

This realization came at the same time as serious thinking on a hosted version of Danger. With a JavaScript versions we
can limit the exposed Danger DSL to only something that can be obtained over the API remotely. By doing this, a hosted
Danger does not need to clone and run the associated projects. This is essential for my sanity. I cannot run multiple
[servers like CocoaDocs](http://cocoadocs.org). So far, I'm calling this Peril. You can consult the
[vision file for Peril](https://github.com/danger/peril/blob/master/VISION.md) if you'd like.

[plugins]: https://www.npmjs.com/search?q=keywords:danger-plugin&page=1&ranking=optimal
[peril]: http://artsy.github.io/blog/2017/09/04/Introducing-Peril/
