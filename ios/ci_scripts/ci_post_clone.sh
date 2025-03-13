#!/bin/sh

set -e
echo "Running ci_post_clone.sh"

cd ../../

# Install Node, CocoaPods, and yarn using Homebrew.
brew install node cocoapods yarn

# Install dependencies
yarn

# See note above about patching for GetEnv Issue
yarn add patch-package
npx patch-package

# xcode cloud sets `CI` env var to 'TRUE':
# This causes a crash: Error: GetEnv.NoBoolean: TRUE is not a boolean.
# This is a workaround for that issue.
CI="true" npx expo prebuild

cd ./ios
pod install
