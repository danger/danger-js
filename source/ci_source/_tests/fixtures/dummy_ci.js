class DummyCI {
  get name() { return "Dummy Testing CI" }

  get isCI() { return false }
  get isPR() { return true }

  get pullRequestID() { return this.env.pr }
  get repoSlug() { return this.env.repo }
  get supportedPlatforms() { return ["github"] }
}

module.exports = DummyCI
