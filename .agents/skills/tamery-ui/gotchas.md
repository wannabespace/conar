# Kit gotchas

Upstream traps and the house answer to each. Read before debugging a kit component.

## base-ui / registry components

- `CommandDialog` is only a Dialog shell — wrap contents in `<Command>` or cmdk crashes.
- `CommandItem` appends a hidden `ml-auto` check, so right-aligned meta goes in `CommandShortcut` (which also hides it). Items that can mount mid-search need an explicit `value`.
- A focusable control inside a `CommandItem` steals the keyboard's place — give it `tabIndex={-1}` + `preventDefault` on pointerdown, and refocus `CommandInput` in `onSelect`.
- cmdk 1.1.1 group filtering is broken (groups never reorder by score) — bypass with `shouldFilter={false}` plus own scoring via cmdk's `defaultFilter`.
- `PopoverContent` defaults to a padded `w-72` form box — menu-like popovers need the `padding` prop and usually `w-auto`.
- `DropdownMenuLabel` requires a `DropdownMenuGroup` parent (base-ui throws).
- base-ui `Menu.Item` closes the menu on click — in-menu toggles need `closeOnClick={false}`.
- base-ui render prop: `<Trigger render={<Button/>}>children</Trigger>` — children land inside. A non-button trigger needs `nativeButton={false}` + `aria-label`, and `<Button render={<a href/>}>` needs its own `aria-label` (jsx-a11y cannot see children through `render`).
- A `render={<Button/>}` wrapper that hard-codes surface classes makes the `variant` prop a lie — wrapper classes own position, animation and shape; the surface belongs to the variant.
- **Base UI writes orientation as `data-orientation="vertical|horizontal"`**, never a bare `data-vertical`. Tailwind compiles `data-vertical:` to a dead selector, so a vendored registry component must be rewritten to `data-[orientation=…]:` before use. Kit vertical separators size with `h-full`, so a fixed-height instance passes `h-4!`.
- **base-ui `Tabs.Panel` keeps an exiting panel mounted until `transitionend`** — with `transition-property: all` at `0s` it never fires and the old panel stays stacked under the new one. Render only the active panel.
- **A popup whose root mounts already-open never plays its entrance**: base-ui seeds `mounted` from `open`, so `data-starting-style` is skipped and only the exit animates. A `key` that remounts a component to reset its form does exactly this — the drawer/dialog root must sit **above** the keyed body. A body inside the portal also unmounts on close, which keeps its hotkeys from firing against a closed panel.
- Selects use macOS overlay mode (`alignItemWithTrigger`) + `min-w-(--anchor-width)`; never fix-width a trigger narrower than its longest option, and pass `size` to trigger *and* content.
- **base-ui `Combobox` `items` must be a referentially stable array** — a layout effect pushes them into the store on every identity change, so an inline `data.map(...)` re-filters, rewrites refs and commits a second render per keystroke. Derive it where it can be memoized (a module-scope query `select`), and default the wrapper to a module-scope empty array.
- **Kit `Item` carries a transparent hairline border**, so a full-bleed row built on it sits 0.5px inside its container and `absolute` children resolve against the padding box. Full-bleed rows need `border-0`.
- **`FieldLabel` wrapping a `Field` is the registry's choice card** — that is what its `has-[>[data-slot=field]]:` rules are for, and how a whole row becomes one hit target without a click handler. Reach for it before building a row out of `Item`. It hovers on its hairline, not its fill: its surface is white in light theme on a near-white pane, so a tint mixes downward and reads as a hole.
- **A vertical kit `Field` stretches its direct children** (`*:w-full`), so anything else placed in one needs `w-fit` — `self-start` sets alignment, not width.
- **Kit `Field` and `FieldGroup` carry spacing as variants, not a base gap** (`Field` on `orientation`, `FieldGroup` on `size`) — one base gap cannot serve a label stacked over its control and one beside it. A call site dialing `gap-*` means the variant is wrong, not the value.
- **A dialog's submit button is outside its `<form>`** — `DialogFooter` is a sibling of the content, so `type="submit"` there submits nothing, silently. Every dialog form needs an `id` and its footer button the matching `form="<id>"`. `required` on a field whose submit is disabled while it is empty is dead too, and would preempt the house error UI if the disable were lifted — which is why `Form` sets `noValidate`.
- **The invalid mark cannot sit inside another button** ([patterns.md](patterns.md)) — `FieldError` renders a button so the message is keyboard-reachable.
- Base `Button` has an `active:translate-y-px` press dip that **replaces** any layout transform — never centre a button with `absolute` + `-translate-y-1/2`; use `inset-y-0 my-auto` or in-flow flex.
- `InputGroup` addon sizes direct-child svgs only — nested icons need an explicit `size-4`. `InputGroupButton` does not forward `size` to `Button` (it maps to its own cva), so every size in that cva must set its own icon-size rule or the icon silently falls back too big.
- A ghost icon button next to a filled input reads shorter than it is — they measure equal, but the field's fill, ring and shadow give it a lip the transparent button lacks. Fix by matching surfaces (`variant="outline"` + the field's radius), never by growing the button.
- **A `Button` variant with no rest text colour renders blue as a link** — the global `a { text-primary }` rule sits in `@layer base`, so any utility beats it, but only if one is there. `outline` carries `text-foreground`; `ghost` deliberately does not (its icon buttons inherit the row's muted colour), so a ghost button rendered as a link sets the colour at its call site.
- Router `Link` concatenates `activeProps.className` without tw-merge — use `data-[status=active]:` variants in one className.
- Tooltip positioner is `pointer-events-none` (kit). Its entrance scales the popup up from the trigger, so an un-gated tooltip landing under the cursor makes the trigger see `mouseleave` and the hover flicker off and on.

## Focus, keyboard, input

- **`autoFocus` only covers the first render of a surface** — a row appended by a click or Enter mounts unfocused, and an input mounted by an interaction is not focused at all (activeElement stays `BODY`). Focus and select from a ref callback or an effect keyed on the flag that marked the row new.
- Hotkeys: always `preventDefault()`; use `getOS(navigator.userAgent)` for ⌘ vs Ctrl labels.
- Enter-to-submit fields must guard IME composition (`!event.nativeEvent.isComposing`) or CJK input submits half-composed.
- Desktop kills text selection app-wide (`.electron body` `select-none`, opted back in by element type), so any component whose job is readable prose needs `select-text`. The `code`/`pre` opt-in excludes `button *` — code inside a click target would otherwise select a word on the second of two fast clicks. Repro in a browser by adding the `electron` class.

## Animation and layout

- **A bare `duration-*`/`ease-*` with no `transition-*` utility animates everything** — `transition-property` resolves to `all`, so the element transitions width, height and colour on any change, and base-ui holds a popup mounted for the duration on close. Durations belong with the animation they time.
- **`animate-none` does not reliably cancel `animate-in`/`animate-out`** (Tailwind's own ordering wins) — make the animation classes conditional instead.
- **`AnimatePresence` only tracks its own direct children.** Rows returned by a wrapper component are one opaque child, so their `exit` never runs and they stay mounted forever. Render the array inline with keys, or keep such rows outside the presence tree.
- **A width-animated panel must have its content state ready on the opening frame** — mint the content's key synchronously in the interaction that opens it, never in a mount effect. Don't gate mounting on collection readiness; never block first paint on the network.
- **`Reorder.Group` values must be stable primitives** — it keys layout by `value` identity, so recreated objects re-measure everything and the strip twitches. Pass ids; set `axis` explicitly.
- `motion.create(X)` belongs in its own `x.motion.tsx`, never `x.utils.ts` — it creates an import cycle that throws a TDZ error. `.utils.ts` stays value-free.
- **A class or `data-*` change on a big container recalcs its entire subtree** (~90ms for the resource layout, sub-millisecond on a button; inline `style` edits on the same elements are <1ms). Animation gates, folding flags and settled markers on page-level panes must be inline styles or refs, never attributes a rule selects on. Small leaf elements can keep their `data-*` state.
- **Never clear a React-managed inline style to `''` imperatively** — React only patches keys whose prop value changed, so a width it set once and an effect later blanks stays blank forever. Restore the value React rendered, or pin through a property React does not own (`minWidth`/`maxWidth`).
- A 1px line cannot be centred in an even gutter with whole-pixel padding — centre with layout, not padding.
- `content-visibility: auto` breaks a scroller's scroll math (skipped items measure as estimates) — use real virtualization.
- Scroll-edge fades must never cover the scrollbar: masks clip it and overlay siblings paint over it. The data table puts gradients inside the scroller as sticky zero-height anchors; `scroll-fade` (mask) only with `no-scrollbar`.
- **`scrollAnchor` pins a turn to the top and releases only when the answer fills the viewport**, so the same chat in two window heights un-pins at different moments and the scrolls drift apart. Its pass also fires on equal-count mutations and scrolls to the oldest unhandled anchor. The chat anchors nothing and lets provider `autoScroll` hold the bottom.

## Panes (`motion-panels`)

- Sizes are plain pixel numbers, so a pane resolves nothing against the group; `maxSize` is capped by what the other sized panes leave, so a pane can never push a sibling out.
- The package is outside the kit's Tailwind source globs — a className written *in* it produces no CSS. Styling belongs in the kit wrapper.
- **The separator must outrank pane content**: it is a sibling of the panes, so at equal `z-index` the later pane's sticky chrome paints over the drag line. The kit separator sits above every in-pane sticky layer and below floating popups.
- **Only the outermost group clips.** A sized pane keeps its pixel size, so a too-narrow window would spill the panes into document overflow — the root group takes `overflow: clip` (not `hidden`, which scrolls). A nested group must stay `visible` or it cuts what its card paints at its own edge. `overflow-clip-margin` is not the fix: the margin becomes scrollable overflow again.

## Data, storage, tables

- **seitu `createWebStorageValue.set` is synchronous per call** — stringify, `setItem`, then a synthetic `StorageEvent` that wakes every persisted value on the page. Never call it per frame; a per-frame value lives in component state and persists through a `debounce`.
- **seitu `useSubscription` defaults to `deepEqual`** — a selector returning a fresh array or carrying query results deep-compares all of it on every store change. Pass `isEqual: Object.is` and let the store hand out a new reference.
- `@tamery/table` column renderers are render props, not component types — `header.tsx`/`body.tsx` *call* them; rendering `<column.header/>` remounts the cell subtree every parent render and kills local cell state.
- **A table skeleton must pin the same column widths the data will get.** In an auto-layout table, percentage bars resolve against a column still being computed and contribute nothing, so the loading table sizes columns from header text and reflows on arrival. Size skeleton bars in `ch` and give skeleton cells the real cells' width classes; a skeleton over explicit pixel columns is already stable and may use percentages.

## Code rendering (streamdown, shiki, Monaco)

- Streamdown needs `@source "../../node_modules/streamdown/dist/*.js"` in globals or it renders unstyled. Its `pre` renders no element (it only stamps `data-block` on the code child), so `ResponseCodeBlock` takes over through `components.code` — branch on `'data-block' in props`, and drop the `node` prop before spreading onto an inline `<code>`.
- **Streamdown ships its own block spacing** (`li` padding, heading margins), so kit prose margins stack on top and chat reads twice as airy as authored. `Response`'s prose string must *replace* them, and its `list-inside` lists need `list-outside` with a margin. Check the dist defaults before adding a margin.
- `@streamdown/code`'s `highlight` schedules a full tokenization on every cache miss and dedupes only its callbacks — `CodeBlock` calls it from the store's `subscribe` alone and serves `getSnapshot` from a per-instance cache. Calling it from `getSnapshot` tokenizes three or four times per render.
- Shiki's dark theme needs the one `!important` rule in globals (the light colour ships inline), or dark mode renders github-light and identifiers go invisible. Keep `data-slot="code-block"` on anything that should get it.
- **Monaco SQL takes its dialect id from `sqlDialects`, never `"sql"`** — only the `pgsql`/`mysql` contributions are registered, so a `sql` model gets stock grammar and no language features. Its themes are hand-mapped from shiki's palettes so editor and `CodeBlock` read as one — keep the two in step.
- **Monaco view zones render in a detached React root** — no context of any kind crosses (router, query client, stores). Zone components take everything as props or module-level stores; swapping a prop for a context hook typechecks, then throws at mount.

## Platform

- Electron `Menu.popup`'s item `click` can fire *after* the close callback — resolve on click immediately and settle null on a short delay. The platform branch lives in `AppContextMenu` in `apps/app`; `packages/ui` stays electron-agnostic.
- **Chrome's autofill paints the `input`, not the control around it** — a transparent input inside a rounded filled `InputGroup` draws a blue rectangle breaking out of the rounding. Kit `Input` neutralises it with an `autofill:shadow-*` inset fill plus `-webkit-text-fill-color`. It must be the `shadow-*` utility, never an arbitrary `[box-shadow:…]`: Tailwind composes rings into `box-shadow`, so setting the property outright erases the focus and invalid rings.
