#!/bin/sh

# Install Node, CocoaPods, and yarn using Homebrew.
sudo ln -s "$(which node)" /usr/local/bin/node
# brew install node
brew install cocoapods
brew install yarn

# Install dependencies
yarn
pod install
