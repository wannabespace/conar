import docsConfig from '../../../../docs/docs.json'
import { source } from './source'

export interface DocsLink {
  href: string
  title: string
}

export interface DocsGroup {
  pages: DocsLink[]
  title: string
}

export interface DocsTab {
  groups: DocsGroup[]
  label: string
}

const hrefFor = (page: string) => `/${page}`

const labelOf = (data: { sidebarTitle?: string; title?: string }) =>
  data.sidebarTitle ?? data.title ?? 'Untitled'

const titleFor = (href: string) => {
  const slugs = href === '/' ? [] : href.slice(1).split('/')
  const page = source.getPage(slugs)

  return page ? labelOf(page.data) : href
}

const linkFor = (page: string): DocsLink => {
  const href = hrefFor(page)

  return { href, title: titleFor(href) }
}

type NavTab = (typeof docsConfig.navigation.tabs)[number]

const groupsFor = (tab: NavTab): DocsGroup[] => {
  if ('groups' in tab && tab.groups) {
    return tab.groups.map((group) => ({
      pages: group.pages.map(linkFor),
      title: group.group,
    }))
  }

  if ('pages' in tab && tab.pages) {
    return [{ pages: tab.pages.map(linkFor), title: tab.tab }]
  }

  return []
}

export const getNav = (): DocsTab[] =>
  docsConfig.navigation.tabs.map((tab) => ({
    groups: groupsFor(tab),
    label: tab.tab,
  }))

export const getNeighbours = (href: string, nav: DocsTab[]) => {
  const pages = nav.flatMap((tab) => tab.groups.flatMap((group) => group.pages))
  const index = pages.findIndex((page) => page.href === href)

  if (index === -1) {
    return { next: null, previous: null }
  }

  return {
    next: pages[index + 1] ?? null,
    previous: pages[index - 1] ?? null,
  }
}
