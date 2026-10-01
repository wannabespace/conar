import type { MainModule, Slotted } from './module'

// Eager on purpose: a module exists iff its folder does.
const list = Object.values(
  import.meta.glob<MainModule>('/src/modules/*/module.tsx', {
    eager: true,
    import: 'default',
  })
)

const slot = (pick: (module: MainModule) => Slotted[] | undefined) =>
  list
    .flatMap((module) => pick(module) ?? [])
    .toSorted((a, b) => a.order - b.order)

export const mainModules = {
  accountNav: slot((module) => module.accountNav),
  authFooter: slot((module) => module.authFooter),
  footerLinks: slot((module) => module.footerLinks),
  headerLinks: slot((module) => module.headerLinks),
  homeSections: slot((module) => module.homeSections),
}
