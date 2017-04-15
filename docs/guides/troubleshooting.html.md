---
title: Troubleshooting
subtitle: Plugin creation
layout: guide
order: 0
---

### I only want to run Danger for internal contributors

Let's say you run Danger on the same CI service that deploys your code. If that's open source, you don't want to be letting anyone pull out your private env vars. The work around for this is to not simply call Danger on every test run:

``` sh
'[ ! -z $DANGER_GITHUB_API_TOKEN ] && yarn danger || echo "Skipping Danger for External Contributor"'
```  

This ensures that Danger only runs when you have the environment variables set up to run. This is how Danger works for a lot of the mobile projects work in Artsy.
