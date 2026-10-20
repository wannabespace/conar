import { slugify } from '@tamery/shared/slugify'
import { createFileRoute } from '@tanstack/react-router'
import { Result } from 'better-result'
import { csvFormatRows } from 'd3-dsv'

import { cellText, proxy, sharePassword } from '~/lib/share.server'

export const Route = createFileRoute('/csv/$shareId')({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const search = new URL(request.url).searchParams
        const sort = search.get('sort')
        const exported = await Result.tryPromise(() =>
          proxy.shares.export({
            id: params.shareId,
            password: sharePassword.get(params.shareId),
            sort: sort
              ? {
                  column: sort,
                  direction: search.get('order') === 'desc' ? 'DESC' : 'ASC',
                }
              : null,
          })
        )

        if (exported.isErr()) {
          return Response.redirect(new URL(`/${params.shareId}`, request.url))
        }

        const { columns, name, rows } = exported.value

        return new Response(
          csvFormatRows([
            columns,
            ...rows.map((row) => row.map((value) => cellText(value) ?? '')),
          ]),
          {
            headers: {
              'content-disposition': `attachment; filename="${slugify(name) || 'table'}.csv"`,
              'content-type': 'text/csv; charset=utf-8',
            },
          }
        )
      },
    },
  },
})
