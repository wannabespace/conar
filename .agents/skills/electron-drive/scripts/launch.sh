#!/bin/zsh
# usage: launch.sh <name> <port>
# Starts an isolated desktop-app instance (own storage = own device) with a CDP port.
# Env: WEB_URL (renderer URL; defaults to the running dev Electron's), ELECTRON_DRIVE_DIR (data root).
set -e
name=${1:?name}; port=${2:?port}
root=$(git rev-parse --show-toplevel)
app_dir=$root/apps/desktop
electron=$(cd $app_dir && node -p "require('electron')")
if [ -z "$WEB_URL" ]; then
  dev_pid=$(pgrep -f "$electron \. --no-sandbox$" | head -1)
  [ -n "$dev_pid" ] && WEB_URL=$(ps eww -o command= -p $dev_pid | tr ' ' '\n' | sed -n 's/^WEB_URL=//p')
fi
[ -n "$WEB_URL" ] || { echo "Set WEB_URL to the app's dev URL (no dev Electron running to read it from)" >&2; exit 1; }
data=${ELECTRON_DRIVE_DIR:-${TMPDIR:-/tmp}/electron-drive}/$name
mkdir -p $data
[ -f $app_dir/dist-electron/main.js ] || { echo "Build the desktop bundle first: (cd $app_dir && NODE_ENV=development npx vite build)" >&2; exit 1; }
cd $app_dir
NODE_ENV=development WEB_URL=$WEB_URL exec $electron . --no-sandbox \
  --user-data-dir=$data --remote-debugging-port=$port \
  --disable-backgrounding-occluded-windows --disable-renderer-backgrounding --disable-background-timer-throttling
