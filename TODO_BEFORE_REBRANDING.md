# TODO before rebranding

## Homebrew: `brew install --cask tamery`

The cask is ready in `homebrew/tamery.rb` but not yet in Homebrew, so the command fails today.

- [ ] Point `download.tamery.app` at ToDesktop (same as `download.conar.app`); check `curl -sI https://download.tamery.app/mac/dmg/arm64` returns 200.
- [ ] Ship the first release built as `Tamery.app` — the downloaded `.dmg` must contain `Tamery.app`, not `Conar.app`.
- [ ] In `homebrew/tamery.rb`, set `version` to that release.
- [ ] Recompute both checksums separately (not with `brew bump-cask-pr`, it copies the arm64 one into intel):
  ```bash
  for a in arm64 x64; do echo "$a $(curl -sSL https://download.tamery.app/versions/<version>/mac/dmg/$a | shasum -a 256 | cut -d' ' -f1)"; done
  ```
- [ ] Verify the updater cache folder name in zap: launch the Tamery build, let it check for updates, then `ls ~/Library/Caches | grep -i updater` — fix `@tamerydesktop-updater` if it differs.
- [ ] Run style, audit and a real install from a local tap (commands in `homebrew/README.md`); all must pass.
- [ ] Fork `Homebrew/homebrew-cask`, copy the cask to `Casks/t/tamery.rb`, open a PR titled `tamery <version> (new cask)` and fill in its checklist.
- [ ] After merge, confirm `brew install --cask tamery` works on a clean machine; later versions are autobumped by Homebrew, nothing else to do.

## Until the cask is merged

These already advertise `brew install --cask tamery`; hide them or accept a broken command until merge:

- [ ] `apps/main/src/routes/_layout/download.tsx` — "Install via Homebrew" card
- [ ] `docs/installation.mdx` — "Homebrew (recommended)"
- [ ] `apps/main/public/llms.txt` — "Install via Homebrew"

## Arch Linux: `yay -S tamery-bin`

`aur/PKGBUILD` and `.github/workflows/aur-sync.yml` publish `tamery-bin` on every GitHub release; the first run creates the package on the AUR.

- [ ] Make sure the first Tamery release is published only after `download.tamery.app` is live — the workflow downloads `https://download.tamery.app/versions/<version>/linux/deb/x64` and fails otherwise.
- [ ] Check the `.deb` layout of that release: the binary must be `/opt/Tamery/tamery-desktop` (today it is `/opt/Conar/conar-desktop`); fix the symlink in `aur/PKGBUILD` if it differs.
- [ ] Confirm the `AUR_SSH_PRIVATE_KEY` secret's AUR account is the one that should own `tamery-bin`.
- [ ] After the workflow passes, `yay -S tamery-bin` on a clean Arch machine; `tamery` must launch the app.
- [ ] File an AUR merge request for `conar-bin` into `tamery-bin` (https://aur.archlinux.org/pkgbase/conar-bin/request) so existing users move over; `conar-bin` is currently broken (pkgver stuck at 0.27.3 with a stale checksum).
