---
name: electron-drive
description: Drive the desktop (Electron) dev app from an agent - launch isolated instances that act as separate devices, sign them in, click, type and read them over CDP, answer native dialogs, screenshot app windows only, and inspect live app state. Use when a check needs the desktop app (desktop-only features, native dialogs, file pickers, cross-device sync) or when asked to run, test or screenshot something "in Electron".
---

# Driving the desktop app

The desktop app is an Electron shell that loads the app's Vite dev server. An agent cannot see it, so it drives its **own** Electron instances over the Chrome DevTools Protocol (CDP) with `agent-browser --cdp <port>`, and reaches native macOS UI through `osascript` and System Events.

## Hard rules

- **Never touch the user's own dev Electron.** It is a child of the desktop dev task; killing it can take the dev task down with it. Launch separate instances instead.
- **Never take a full-screen screenshot.** The user's screen shows their private apps. Capture the page over CDP, or one app window by its window id.
- **Never click a native context menu by screen coordinates.** Those menus are not in the accessibility tree, and an offset that hit one item last time can hit **Remove** the next. Run the same action through the app's code path instead, or ask the user to click it.
- **Back up any user file a flow writes before testing it** (the SSH host-key trust dialog appends to `~/.ssh/known_hosts`) and restore it afterwards.
- **Test credentials only.** Create a dedicated database role or SSH user with a password generated for the session, keep it in a scratch env file, and never type the user's real secrets into the app.

## Launch an isolated instance

`scripts/launch.sh <name> <port>` starts an Electron instance on the built desktop main process with:

- `--user-data-dir=<scratch>/<name>`: its own storage, session and single-instance lock. Two names make two independent **devices** on one account, which is how cross-device sync is tested.
- `--remote-debugging-port=<port>`: the CDP endpoint for `agent-browser --cdp <port>`.
- `--disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling`: without these a window covered by the user's apps reports `visibilityState: hidden`, `requestAnimationFrame` stops, and selects and popovers never open.

The script reads the renderer URL from the running dev Electron's environment (`ps eww`), or from `WEB_URL` when set. Run it in the background and wait for `curl -s localhost:<port>/json/list` to list the app page.

**Main and preload code is not hot-reloaded.** After changing either, rebuild the desktop bundle (`NODE_ENV=development npx vite build` in the desktop workspace) and restart the instances. Renderer code hot-reloads; when a reload half-applies (an error like "x is not a function" from a component whose props just changed), reload the page.

**Stopping:** kill by the user-data-dir pattern and confirm every process is gone; helper processes can outlive the main one, so `kill -9` whatever is left after a few seconds. In zsh, `$pids` holding several lines does not word-split, so `kill $pids` fails; use `kill ${=pids}`. A surviving old instance keeps the port and the lock, and the new launch quits silently. After any restart run `agent-browser close --all`, or stale CDP sessions report "tab is not responding".

## Sign in

Desktop sign-in is a code challenge that a signed-in browser approves; no password is typed.

1. Click **Sign In** on the instance. It opens the challenge URL in the default browser; if that browser is signed in to the dev site, the instance signs in by itself.
2. If it does not: before clicking, override `window.open` in the page to store the URL instead of opening it, click, read the URL back, and open it in the user's Chrome through the claude-in-chrome tools.

## Drive the page

- `agent-browser --cdp <port> snapshot -i` lists interactive elements with refs; `click @ref`, `fill @ref "text"`, `press Tab`, `eval "<js>"`, `screenshot <path>`. Refs change after renders: re-snapshot before each step.
- Select popups can put a scroll arrow over the last option. Open the select, then click the option from the page: `[...document.querySelectorAll('[role=option]')].find(o => o.innerText.trim().startsWith('Label')).click()`.
- Prefer clicking links to setting `location.hash`; the router can bounce a hash it did not navigate to.
- A long or repeated flow (a create form filled for many cases) is worth a small script that snapshots, finds refs by role and name, and fills them.

## Inspect live state

The page runs the app's real modules from the Vite dev server, so `eval` can `import()` them and read collections, the query cache or stores. Import the **exact** URL the app loaded, hot-reload timestamp included, or the import gets a fresh module with empty state:

```js
const url = performance.getEntriesByType('resource').map((e) => e.name).filter((n) => /\/src\/path\/to\/module\.ts/.test(n)).pop()
const mod = await import(url)
```

Useful patterns: read each device's local copy of a record next to what the server returns for it; subscribe to the query cache and log failed queries with their keys to find what runs when it should not. Mask secrets before printing (show `<set>` or `<empty>`, never the value).

## Native UI

`scripts/dialog.sh <name> "<button>" [shot.png]` waits for a native dialog on the named instance, optionally captures it, and clicks the button. Under the hood:

- A message box is a window whose `role description` is `dialogue` on the instance's process (find the pid by its user-data-dir), or, depending on how macOS presents it, `sheet 1` of the app window. Its `static text` values hold the message, so read them before answering (compare a host-key fingerprint, for one).
- An open or save panel shows as a sheet. Bring the instance frontmost, then `keystroke "g" using {command down, shift down}`, type the path, and press Return twice. This briefly takes focus from the user.
- `scripts/winshot.swift` lists a process's on-screen windows (id, layer, size, title) from CoreGraphics; `screencapture -x -o -l <id> out.png` captures one window. Native popups sit on a non-zero layer.

## Hand results to the user

Screenshots go to the session scratchpad and reach the user through `SendUserFile`, a few at a time, each with a one-line caption saying what it proves.

## Clean up

Before finishing, list what is still running or changed and ask before removing it: instances and their data dirs, helper containers (an SSH bastion), keys added to the SSH agent (`ssh-add -d`), test records created on the dev account, test roles, tables or network exposure created on a remote database, and any restored file such as `known_hosts`.
