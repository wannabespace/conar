#!/bin/zsh
# usage: dialog.sh <name> "<button>" [shot.png]
# Waits up to 15s for a native dialog on the named instance, optionally captures it, then clicks the button.
name=${1:?name}; button=${2:?button}; shot=$3
here=${0:A:h}
pid=$(pgrep -f "user-data-dir=.*/$name " | head -1)
[ -n "$pid" ] || { echo "no instance named $name" >&2; exit 1; }
for i in $(seq 1 30); do
  if osascript -e "tell application \"System Events\" to tell (first process whose unix id is $pid) to exists (first window whose role description is \"dialogue\")" 2>/dev/null | grep -q true; then
    osascript -e "tell application \"System Events\" to tell (first process whose unix id is $pid) to get value of every static text of (first window whose role description is \"dialogue\")"
    if [ -n "$shot" ]; then
      sleep 0.4
      wid=$(swift $here/winshot.swift $pid | awk '$2 != 0 || $3 < 900 {print $1}' | head -1)
      [ -n "$wid" ] && screencapture -x -o -l $wid "$shot"
    fi
    osascript -e "tell application \"System Events\" to tell (first process whose unix id is $pid) to click button \"$button\" of (first window whose role description is \"dialogue\")" >/dev/null
    echo "clicked $button"; exit 0
  fi
  sleep 0.5
done
echo "no dialog" >&2; exit 1
