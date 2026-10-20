import { getRouteApi } from '@tanstack/react-router'

import { getCapabilities } from './capabilities'

const { useRouteContext } = getRouteApi('/_protected/connection/$resourceId')

/** What the open resource's engine calls a table, a column and a row. */
export const useObjectNames = () =>
  getCapabilities(useRouteContext().dialect).names
