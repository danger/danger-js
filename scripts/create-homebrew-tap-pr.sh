#!/bin/bash

[ -z ${VERSION+x} ] && { echo "VERSION is missing"; exit 1; }

FILE=brew-distribution/danger-macos.zip

if [ ! -f ${FILE} ]; then
  echo ${FILE} not found!
  exit 1
fi

SHA=$(shasum -a 256 ${FILE} | cut -f 1 -d " ")
echo "$SHA"

# Clone tap repo
HOMEBREW_TAP_TMPDIR=$(mktemp -d)
git clone --depth 1 git@github.com:danger/homebrew-tap.git "$HOMEBREW_TAP_TMPDIR"
cd "$HOMEBREW_TAP_TMPDIR" || exit 1

# git config user.name danger
# git config user.email danger@users.noreply.github.com

# Write formula
echo "class DangerJs < Formula" > danger-js.rb
echo "  homepage \"https://github.com/danger/danger-js\"" >> danger-js.rb
echo "  url \"https://github.com/danger/danger-js/releases/download/${VERSION}/danger-macos.zip\"" >> danger-js.rb
echo "  sha256 \"${SHA}\"" >> danger-js.rb
echo >> danger-js.rb
echo "  def install" >> danger-js.rb
echo "    bin.install \"danger\"" >> danger-js.rb
echo "  end" >> danger-js.rb
echo "end" >> danger-js.rb

# Commit changes
git add danger-js.rb
git commit -m "Releasing danger-js version ${VERSION}"
git push origin master
