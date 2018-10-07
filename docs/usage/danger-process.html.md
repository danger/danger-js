---
title: Danger in my Language
subtitle: Using Danger Process
layout: guide_js
order: 3
blurb: How to use `danger process` to create a Danger runner for any language.
---

## Danger Process

In version 2.0.0 and above, Danger comes with a new command: `danger process`. This command should have all the same
parameters as `danger` and is meant to be an optional replacement. It's idea is that the responsibilities of Danger can
be split into three steps:

- Dangerfile DSL setup.
- Evaluation of a Dangerfile.
- Handling the results of the Dangerfile run.

Danger JS will handle the first and the last steps, and another process will handle the second. This means most of the
really tricky work stays inside Danger, and the other process can only has to worry about translating the DSL into
something that feels natural in the environment of your app.

### Implementing a Danger Process Runner

`danger process` expects one argument, the command to trigger the process for Danger JS to run. This command should
expect the Danger DSL as JSON in STDIN, and it is expected that it would post results to STDOUT via JSON.

You can preview the DSL which will be sent to your process via `danger pr` with the `--js` and `--json` flags, for
example:

```sh
danger pr https://github.com/danger/danger-js/pull/395 --js
```

This shows you DSL as a JavaScript object - this is easier to read and syntax highlighted. If you'd like a data fixture,
use `--json`:

```sh
danger pr https://github.com/danger/danger-js/pull/395 --json > danger-js-395.dsl.json
```

This will work for any open repo, and if you've set up your local shell to include `DANGER_GITHUB_API_TOKEN` then you
can use this with any private repository too. The JSON schema is documented in Danger JS's types as
[DangerJSONDSLType][]. I plan to add a full reference for this, similar to the reference for the user's DSL in the
future in these docs. _Note:_ The JSON will include your access token, so you probably want to sanitze that before
commiting it to the repo. I accidentally shipped 2 tokens in writing the feature.

A runner can output anything during the process to STDOUT, and it will be logged to the user. However, Danger JS is
listening for a JSON response in this format:

```json
{
  "warnings": [{ "message": "There isn't a CHANGELOG entry." }],
  "messages": [],
  "fails": [],
  "markdowns": []
}
```

_Note:_ `"markdowns"` is a string array, everything else is an object with message. I think this will change eventually.
When Danger supports inline messages, then `"file"` and `"line"` will also be supported in the violation. _Note:_ I'd
like to add some sort of versioning to this.

### Some Examples

### Tiny, and maybe too simple

The simplest example I can give you, ironically, is a runner using Ruby.

```ruby
  #!/usr/bin/env ruby

require 'json'
dsl_json = STDIN.tty? ? 'Cannot read from STDIN' : $stdin.read
danger = JSON.parse(dsl_json)
results = { warnings: [], messages:[], fails: [], markdowns: [] }

if danger.github.pr.body.include? "Hello world"
  results.messages << { message: "Hey there" }
end

STDOUT.write(results.to_json)
```

As Ruby is duck-typed, it doesn't need any infrastructure. You can parse the incoming JSON into an object, then work
with the standard library to provide a Dangerfile environment. If you saved this file as `dangerfile.rb`, and
`chmod +x dangerfile.rb` then you can run `danger process 'dangerfile.rb`.

### Tiny, and not too simple

Well, the above is nice as an example but the moment you let someone else control evaluation it's a bit more complex but
to be honest - what you're probably looking to do.

```ruby
  #!/usr/bin/env ruby

require 'json'
dsl_json = STDIN.tty? ? 'Cannot read from STDIN' : $stdin.read
danger = JSON.parse(dsl_json)
results = { warnings: [], messages:[], fails: [], markdowns: [] }
filename = "Dangerfile"

class Dangerfile
  # All these functions are effectively globals inside
  # the Dangerfile during evaluation
  def warn(msg)
    results.warnings << { message: msg }
  end

  def fail(msg)
    results.fails << { message: msg }
  end

  def markdowns(msg)
    results.markdowns << { message: msg }
  end

  def messages(msg)
    results.messages << { message: msg }
  end

  def run
    instance_eval do
      begin
        # Eval the cwd's Dangerfile in the context
        # of this file, making it a custom runtime
        eval(File.read(filename), nil, filename)

        # Writes the results to a tmpdir file, then
        # pass it back to danger-js by putting the
        # url of the file back via stdout
        results_path = Dir.tmpdir + "danger-results.json"
        File.write(results_path, results.to_json)
        puts "danger-results:/" + results_path

      rescue Exception => e
        # Generic error handling
        message = "Invalid `#{path.basename}` file: #{e.message}"
        raise Error.new(message, path, e.backtrace, contents)
      end
    end
  end
end

# Start the code evaluation
runtime = Dangerfile.new
runtime.run
```

This changes 2 things mainly:

- The "runtime" you've made it mainly about running someone elses code. So, it's a lot closer in concept to what Danger
  is in production. It means you don't have the rules inside the application anymore.
- The results are passed out via a `danger-results://path/to/results.json` URI in STDOUT instead of posting the JSON
  directly. Printing a potentially large JSON object via STDOUT can be less reliable than you'd expect (async logs,
  shells splitting messages across.)

### Serious Stuff

Let's look at something a bit more complex. [Danger Swift][danger-swift].

Danger Swift aims to act more like a peer to Danger JS/Ruby, and so it is a two step process. The first process' job is
to evaluate a user's Dangerfile instead of the rule evaluation happening inside the initial process.

Which means the code _a user of Danger Swift_ writes has to handle the DSL, and not the message receiving/sending to
Danger JS.

To show you how this process works, Danger Swift takes a [JSON][swift-json] document via [STDIN][swift-stdin], [compiles
and evaluates][swift-eval] a [Swift file][swift-dangerfile] and then passes the results back to `danger process` via
[STDOUT][swift-stdout].

### Things You Probably Have To Do

At least to make it shine:

- Implement a few of the functions inside the Danger DSL (`sentence`, `fileLink` in particular are useful)
- Implement a GitHub API, there is a settings object which includes all the github metadata needed to set it up

That's probably it. You will need to provide instructions for someone with no node experience to set up Danger JS. On a
Mac, that looks like:

```js
brew install node
npm install -g danger
```

It's pretty likely that your CI already has node, so it can just be `npm install -g danger`. If not, look [into nvm][].

Finally, let me ([@orta][]) know! I want to keep track of them all on the Danger Systems site :+1:.

[danger-swift]: https://github.com/danger/danger-swift
[swift-json]: https://github.com/danger/danger-swift/blob/master/fixtures/eidolon_609.json
[swift-stdin]:
  https://github.com/danger/danger-swift/blob/1576e336e41698861456533463c8821675427258/Sources/Runner/main.swift#L9-L11
[swift-eval]:
  https://github.com/danger/danger-swift/blob/1576e336e41698861456533463c8821675427258/Sources/Runner/main.swift#L23-L40
[swift-dangerfile]:
  https://github.com/danger/danger-swift/blob/1576e336e41698861456533463c8821675427258/Dangerfile.swift
[swift-stdout]:
  https://github.com/danger/danger-swift/blob/1576e336e41698861456533463c8821675427258/Sources/Runner/main.swift#L48-L50
[swift-first-pr]: https://github.com/danger/danger-swift/pull/12
[dangerjsondsltype]: https://github.com/danger/danger-js/blob/master/source/dsl/DangerDSL.ts
[into nvm]: https://github.com/creationix/nvm
[@orta]: https://github.com/orta
