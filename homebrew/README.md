# Tamery on Homebrew

`tamery.rb` is the cask behind `brew install --cask tamery`, submitted to [Homebrew/homebrew-cask](https://github.com/Homebrew/homebrew-cask) as `Casks/t/tamery.rb`.

Once merged there, Homebrew owns it: BrewTestBot [autobumps](https://docs.brew.sh/Autobump) every cask with a working `livecheck` every 3 hours, reading the version from ToDesktop's `latest-mac.yml`. No release step is needed on our side.

## Submitting or changing the cask

Requires a published macOS release whose bundle is `Tamery.app` on `download.tamery.app`.

```bash
brew tap-new tamery-local/test
cp homebrew/tamery.rb "$(brew --repo tamery-local/test)/Casks/"
# set `version`, then for each arch: curl -sSL <url> | shasum -a 256
export HOMEBREW_NO_INSTALL_FROM_API=1
brew style tamery-local/test/tamery
brew audit --cask --new --online --arch=all tamery-local/test/tamery
brew install --cask tamery-local/test/tamery
brew untap tamery-local/test
```

Then copy it to `Casks/t/tamery.rb` in a fork of homebrew-cask and open a PR titled `tamery <version> (new cask)`.

`brew bump-cask-pr --write-only` writes the arm64 checksum into both arch slots, so compute them separately.
