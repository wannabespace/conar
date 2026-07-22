# Motion

- `motion` library for interruptible animation, not CSS transitions (transitions snap under frame drops).
- House curve `[0.32, 0.72, 0, 1]`, 200–300ms. Collapse via width/transform; no whole-panel opacity fades.
- `AnimatePresence` for mount/exit of conditional chrome.
- **Virtualized reorder** (tables tree pin): motion `layout` can't work with tanstack-virtual — stable `getItemKey` (row id, not index) + `motion.li` with `initial={false} animate={{ y: virtualRow.start }}`. `y` changes only on reorder, never during scroll. Ref: `tables-virtual-list.tsx`.
- Heavy-reflow guard: when animating a container holding a virtualized table, pin the data area's width for the duration.
- **Filter strip is persistent** (hover-reveal rejected): animates only on mount/exit — `opacity 0→1, y 8→0, scale 0.98→1`, 200ms. Chip anatomy `[eye | column | op | value | ✕]`; eye disables (content dims to `opacity-45`, eye/✕ stay full).
- No layout shifts on hover — reserve space, animate opacity/transform only.
- Scroll-edge cues: never JS scroll listeners. Plain scrollers use shadcn `scroll-fade` (CSS scroll-driven mask). The data table uses `table-fade` overlay gradients instead (mask would clip the scrollbar) — see gotchas.
