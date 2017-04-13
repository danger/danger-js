Here's an example CURL request to add a new fixture

```sh
curl \
-H "Authorization: token <GITHUB_OAUTH_TOKEN>" \
-H "Accept: application/vnd.github.black-cat-preview+json" \
--request GET https://api.github.com/repos/artsy/emission/pulls/327/requested_reviewers \
> source/platforms/_tests/fixtures/requested_reviewers.json
```
