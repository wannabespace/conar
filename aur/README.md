# Tamery on AUR

- Package: https://aur.archlinux.org/packages/tamery-bin
- Install: `yay -S tamery-bin` (or any AUR helper)

`PKGBUILD` repackages the released `.deb`. On every published GitHub release, `.github/workflows/aur-sync.yml` sets `pkgver` from `apps/desktop/package.json`, fills the checksum with `updpkgsums`, generates `.SRCINFO`, test-builds the package and pushes it to the AUR — so `pkgver` and `sha256sums` in this folder are not kept current.

Needs the `AUR_SSH_PRIVATE_KEY`, `AUR_GIT_NAME` and `AUR_GIT_EMAIL` secrets; the key must belong to an AUR account that maintains `tamery-bin`.

To try it locally on Arch: set `pkgver` to a released version, then `updpkgsums && makepkg -si` in this folder.
