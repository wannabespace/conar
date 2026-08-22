# Motion

- `motion` library for interruptible animation, not CSS transitions (transitions snap under frame drops). Exception: pure color/opacity hovers, where a Tailwind `transition-colors` is fine.
- House curve `[0.32, 0.72, 0, 1]`, 150–300ms. Collapse via width/transform; no whole-panel opacity fades.
- `AnimatePresence` for mount/exit of conditional chrome.
- No layout shifts on hover — reserve space, animate opacity/transform only.
- **Virtualized reorder** (tables tree pin): motion `layout` can't work with tanstack-virtual — stable `getItemKey` (row id, not index) + `motion.li` with `initial={false} animate={{ y: virtualRow.start }}`. `y` changes only on reorder, never during scroll. Ref: `navigator/tables-list.tsx`.
- **Collapse/disclosure**: animate CSS grid rows with motion, not a Tailwind transition — `motion.div` `initial={false} animate={{ gridTemplateRows: open ? '1fr' : '0fr' }}` (house curve) wrapping a `min-h-0 overflow-hidden` child. Ref: `TableError` in `-tabs/table/-components/table/table.tsx`.
- **Swapping two panels in one slot**: `AnimatePresence mode="popLayout"` keyed on the panel id, `opacity` + a small `x` offset in the push direction (12px for a full panel, 6px for a label inside a button), 150–180ms — push and back then read as one object moving. Ref: `navigator/navigator.tsx`, `navigator-switcher.tsx`.
- **Reorderable strips**: `Reorder.Group` with `layout="position"` on items and `transition={{ layout: dragging ? houseCurve : { duration: 0 } }}` — items animate while dragging, snap otherwise (no drift when labels change width). Value identity rules in gotchas.md.
- Scroll-edge cues: never JS scroll listeners. Plain scrollers use `scroll-fade` (CSS scroll-driven mask, kit utility). The data table uses `table-fade` overlay gradients instead (a mask would clip the scrollbar) — see gotchas.
