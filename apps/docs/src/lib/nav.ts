import docsConfig from '../../../../docs/docs.json'
import { source } from './source'

const getNavPage = (path: string) => {
  const page = source.getPage(path.split('/'))

  return {
    href: `/${path}`,
    title: page?.data.sidebarTitle ?? page?.data.title ?? path,
  }
}

const tabs = docsConfig.navigation.tabs.map((tab) => {
  const groups = tab.groups
    ? tab.groups.map((group) => ({
        pages: group.pages.map(getNavPage),
        title: group.group,
      }))
    : [{ pages: tab.pages.map(getNavPage), title: tab.tab }]

  return {
    groups,
    label: tab.tab,
    pages: groups.flatMap((group) => group.pages),
  }
})

const groups = tabs.flatMap((tab) => tab.groups)
const pages = tabs.flatMap((tab) => tab.pages)

const findTab = (href: string) =>
  tabs.find((tab) => tab.pages.some((page) => page.href === href))

export const nav = {
  getActiveTab: (pathname: string) => findTab(pathname) ?? tabs[0] ?? null,
  getGroup: (href: string) =>
    groups.find((group) => group.pages.some((page) => page.href === href)) ??
    null,
  getNeighbours: (href: string) => {
    const tabPages = findTab(href)?.pages ?? []
    const index = tabPages.findIndex((page) => page.href === href)

    if (index === -1) {
      return { next: null, previous: null }
    }

    return {
      next: tabPages[index + 1] ?? null,
      previous: tabPages[index - 1] ?? null,
    }
  },
  getPage: (href: string) => pages.find((page) => page.href === href) ?? null,
  groups,
  tabs,
}
