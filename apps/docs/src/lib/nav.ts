import docsConfig from '../../../../docs/docs.json'
import { source } from './source'

const getNavPage = (path: string) => {
  const page = source.getPage(path.split('/'))

  return {
    href: `/${path}`,
    title: page?.data.sidebarTitle ?? page?.data.title ?? path,
  }
}

const groups = docsConfig.navigation.groups.map((group) => ({
  pages: group.pages.map(getNavPage),
  title: group.group,
}))

const pages = groups.flatMap((group) => group.pages)

export const nav = {
  getGroup: (href: string) =>
    groups.find((group) => group.pages.some((page) => page.href === href)) ??
    null,
  getNeighbours: (href: string) => {
    const index = pages.findIndex((page) => page.href === href)

    if (index === -1) {
      return { next: null, previous: null }
    }

    return {
      next: pages[index + 1] ?? null,
      previous: pages[index - 1] ?? null,
    }
  },
  getPage: (href: string) => pages.find((page) => page.href === href) ?? null,
  groups,
}
