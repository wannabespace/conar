import docsConfig from '../../../../docs/docs.json'
import { source } from './source'

export interface NavPage {
  href: string
  title: string
}

export interface NavGroup {
  pages: NavPage[]
  title: string
}

export interface NavTab {
  groups: NavGroup[]
  label: string
}

const getNavPage = (path: string): NavPage => {
  const page = source.getPage(path.split('/'))

  return {
    href: `/${path}`,
    title: page?.data.sidebarTitle ?? page?.data.title ?? path,
  }
}

const tabs: NavTab[] = docsConfig.navigation.tabs.map((tab) => ({
  groups: tab.groups
    ? tab.groups.map((group) => ({
        pages: group.pages.map(getNavPage),
        title: group.group,
      }))
    : [{ pages: tab.pages.map(getNavPage), title: tab.tab }],
  label: tab.tab,
}))

const pages = tabs.flatMap((tab) => tab.groups.flatMap((group) => group.pages))

export const nav = {
  getActiveTab: (pathname: string) =>
    tabs.find((tab) =>
      tab.groups.some((group) =>
        group.pages.some((page) => page.href === pathname)
      )
    ) ??
    tabs[0] ??
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
  tabs,
}
