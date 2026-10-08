import { createFileRoute, getRouteApi, notFound } from '@tanstack/react-router'

import { settingsSections } from '~/core/settings/sections'

const { useLoaderData } = getRouteApi('/_protected/settings/$section')

const SettingsSectionPage = () => {
  const { component: Section } = useLoaderData()

  return <Section />
}

export const Route = createFileRoute('/_protected/settings/$section')({
  loader: ({ params }) => {
    const section = settingsSections.find(({ slug }) => slug === params.section)
    if (!section) {
      throw notFound()
    }
    return section
  },
  component: SettingsSectionPage,
})
