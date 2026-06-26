import { getRouteApi } from '@tanstack/react-router'

export const connectionResourceRouteApi = getRouteApi('/_protected/connection/$resourceId')
export const tableRouteApi = getRouteApi('/_protected/connection/$resourceId/table/')
