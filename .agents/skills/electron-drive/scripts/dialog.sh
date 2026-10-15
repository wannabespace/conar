#!/bin/zsh
# usage: dialog.sh <name> "<button>" [shot.png]
# Waits up to 15s for a native dialog on the named instance, optionally captures it, then clicks the button.
# macOS shows a message box either as its own dialogue window or as a sheet on the app window; both are handled.
name=${1:?name}; button=${2:?button}; shot=$3
here=${0:A:h}
pid=$(pgrep -f "user-data-dir=.*/$name " | head -1)
[ -n "$pid" ] || { echo "no instance named $name" >&2; exit 1; }
proc="(first process whose unix id is $pid)"
for i in $(seq 1 30); do
  for dialog in '(first window whose role description is "dialogue")' '(sheet 1 of window 1)'; do
    if osascript -e "tell application \"System Events\" to tell $proc to exists $dialog" 2>/dev/null | grep -q true; then
      osascript -e "tell application \"System Events\" to tell $proc to get value of every static text of $dialog"
      if [ -n "$shot" ]; then
        sleep 0.4
        # A sheet draws inside the app window, the biggest one; a dialogue window is the small one beside it.
        [[ $dialog == *sheet* ]] && pick='NR == 1' || pick='$2 != 0 || $3 < 900'
        wid=$(swift $here/winshot.swift $pid | sort -k3 -n -r | awk "$pick {print \$1}" | head -1)
        [ -n "$wid" ] && screencapture -x -o -l $wid "$shot"
      fi
      osascript -e "tell application \"System Events\" to tell $proc to click button \"$button\" of $dialog" >/dev/null
      echo "clicked $button"; exit 0
    fi
  done
  sleep 0.5
done
echo "no dialog" >&2; exit 1
