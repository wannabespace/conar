# cmdk@1.1.1 patch

Why `patches/cmdk@1.1.1.patch` exists (registered in `pnpm-workspace.yaml` → `patchedDependencies`). Two upstream bugs, both hit by the actions center (`apps/app/src/routes/-components/actions-center.tsx`). No fixed release exists — 1.1.1 is the latest version. If cmdk is upgraded, re-check both fixes landed upstream before dropping the patch.

## 1. Groups are never reordered by score

When filtering, cmdk scores every item correctly (e.g. `Reload window` = 0.99 for "relo", a fuzzy match = 0.004), but the code that reorders group DOM nodes looks groups up with:

```js
querySelector('[cmdk-group=""][data-value="<internal react id>"]')
```

while the element's `data-value` attribute actually holds the group's registered value (its heading text, e.g. `"Application"`). The selector never matches, so groups stay in source order forever and a weak match in an earlier group renders above a strong match in a later one ("Switch to dark theme" above "Reload window").

**Fix**: the lookup resolves the group's registered value from cmdk's own value registry (`d.current.get(id).value`) instead of using the internal id, so the sorted group order is applied to the DOM.

## 2. Stale scroll position after re-sort

cmdk only scrolls the selected item into view when the *selection changes*. While typing, the top-ranked item often stays the same across keystrokes — selection doesn't change, so no scroll happens even though the list content just re-sorted and moved under a stale `scrollTop`. Result: the auto-selected top result sits hidden above the fold.

**Fix**: the search-change branch (`setState("search")`) additionally schedules cmdk's own scroll-into-view routine (the same one it runs on selection change and on mount), so every keystroke reveals the selected item. No app-side scroll code needed.

## Scope

Both fixes are one-line edits applied identically to `dist/index.mjs` and `dist/index.js`. Behavior is unchanged for consumers that don't use groups or don't scroll.
