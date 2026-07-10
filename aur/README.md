Conar : https://github.com/wannabespace/conar
AUR   : https://aur.archlinux.org/packages/conar-bin

If you want to help, feel free to fork & open a PR.

## Syncing versions with the repo

The AUR package (`conar-bin`) is kept in sync with the app version from this repo.

- **Source of truth:** `apps/desktop/package.json` → `version`
- **Synced files:** `aur/PKGBUILD` (`pkgver`) and `aur/.SRCINFO`

### From the repo root

```bash
# Sync pkgver from apps/desktop/package.json (no network)
pnpm run aur:sync

# Sync version and update sha256sums by fetching the .deb (recommended before releasing to AUR)
pnpm run aur:sync:checksum
```

After running, push the updated `aur/` files to the AUR package:

- Clone: `git clone ssh://aur@aur.archlinux.org/conar-bin.git` (or use your AUR helper)
- Copy `PKGBUILD`, `.SRCINFO`, and optionally `LICENSE` from this `aur/` folder
- Commit and push to AUR

### CI

A GitHub Actions workflow runs to ensure `aur/` stays in sync when the desktop version changes. See `.github/workflows/aur-sync.yml`.
