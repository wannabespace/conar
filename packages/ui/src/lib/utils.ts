import { createCn } from 'cn/config'

export const cn = createCn({
  // Sync with --font-weight-row in globals.css: unknown font-* merges as a font family.
  extend: { classGroups: { 'font-weight': [{ font: ['row'] }] } },
})
