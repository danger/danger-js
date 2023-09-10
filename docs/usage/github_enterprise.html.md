---
title: GitHub Enteprise
subtitle: Danger on GHE
layout: guide_js
order: 4
blurb: An overview of using Danger with GitHub Enterprise, and some examples
---

If you are using DangerJS on GitHub Enteprise, you will need to set the Danger used ID to the GitHub Actions bot. This
will enable Danger to correctly comment and update on PRs.

If you include Danger as a dev-dependency, then you can call danger directly as another build-step after your tests:

```yml
name: Node CI
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@master
    - name: Use Node.js 10.x
      uses: actions/setup-node@v1
      with:
        node-version: 10.x
    - name: install yarn
      run: npm install -g yarn
    - name: yarn install, build, and test
      run: |
        yarn install  --frozen-lockfile
        yarn build
        yarn test
    - name: Danger
      run: yarn danger ci
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        DANGER_GHE_ACTIONS_BOT_USER_ID: *user_id*
```

If you are not running in a JavaScript ecosystem, or don't want to include the dependency then you can use Danger JS as
an action.

```yml
name: "Danger JS"
on: [pull_request]

jobs:
  build:
    name: Danger JS
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    - name: Danger
      uses: danger/danger-js@9.1.6
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        DANGER_GHE_ACTIONS_BOT_USER_ID: *user_id*
```
