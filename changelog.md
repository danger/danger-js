### master

//  Add your own contribution below

* Danger will post a comment on a GitHub PR with any Fails - orta

### 0.0.2 

OK, first usable for others version. Only supports GitHub and Travis CI.

You can run by doing:

```sh
danger
``` 

Make sure you set a `DANGER_GITHUB_API_TOKEN` on your CI - [see the Ruby guide](http://danger.systems/guides/getting_started.html#setting-up-danger-to-run-on-your-ci) for that.

Then you can make a `dangerfile.js` (has to be lowercase, deal with it.) It has access to a whopping 2 DSL attributes.

```sh
pr
git
fail(message: string)
```

`pr` _probably_ won't be sticking around for the long run, but if you're using a `0.0.2` release, you should be OK with that. It's the full metadata of the PR, so [this JSON file](https://raw.githubusercontent.com/danger/danger/master/spec/fixtures/github_api/pr_response.json). 
`git` currently has:

```sh
git.modified_file
git.created_files
git.deleted_files 
```

which are string arrays of files.

`fail(message: string)` will let you raise an error, and will make the process return 1 after the parsing has finished.

Overall: your Dangerfile should look something like:

```js
import { danger } from "danger"

const hasChangelog = danger.git.modified_files.includes("changelog.md")
if (!hasChangelog) {
  fail("No Changelog changes!")
}
```

That should do ya. I think. This doens't support babel, and I haven't explored using other modules etc, so 

./

### 0.0.1

Not usable for others, only stubs of classes etc.