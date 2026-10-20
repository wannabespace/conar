export type OrderStatus = 'paid' | 'pending' | 'refunded'

export interface Order {
  created_at: string
  customer: string
  id: string
  status: OrderStatus
  total: string
  user_id: string
}

export const ORDERS: Order[] = [
  {
    created_at: '2026-09-30 15:51',
    customer: 'Priya Raman',
    id: '58340',
    status: 'paid',
    total: '$608.94',
    user_id: '1176',
  },
  {
    created_at: '2026-09-14 12:54',
    customer: 'Tomás Ferreira',
    id: '58307',
    status: 'paid',
    total: '$608.65',
    user_id: '1179',
  },
  {
    created_at: '2026-09-15 08:58',
    customer: 'Daniel Okafor',
    id: '58309',
    status: 'pending',
    total: '$605.91',
    user_id: '1157',
  },
  {
    created_at: '2026-09-29 18:44',
    customer: 'Anna Kowalska',
    id: '58338',
    status: 'refunded',
    total: '$602.30',
    user_id: '1150',
  },
  {
    created_at: '2026-09-13 16:49',
    customer: 'Mateo Álvarez',
    id: '58305',
    status: 'paid',
    total: '$600.36',
    user_id: '1153',
  },
  {
    created_at: '2026-09-16 04:59',
    customer: 'Kenji Mori',
    id: '58311',
    status: 'paid',
    total: '$592.24',
    user_id: '1135',
  },
  {
    created_at: '2026-09-28 20:36',
    customer: 'Hana Kobayashi',
    id: '58336',
    status: 'paid',
    total: '$584.86',
    user_id: '1172',
  },
  {
    created_at: '2026-09-12 19:42',
    customer: 'Oskar Lindqvist',
    id: '58303',
    status: 'pending',
    total: '$581.35',
    user_id: '1175',
  },
  {
    created_at: '2026-09-17 00:59',
    customer: 'Jonas Weber',
    id: '58313',
    status: 'paid',
    total: '$568.14',
    user_id: '1161',
  },
  {
    created_at: '2026-09-27 22:27',
    customer: 'Aiko Tanaka',
    id: '58334',
    status: 'pending',
    total: '$557.27',
    user_id: '1146',
  },
  {
    created_at: '2026-09-11 21:34',
    customer: 'Felix Braun',
    id: '58301',
    status: 'paid',
    total: '$552.32',
    user_id: '1149',
  },
  {
    created_at: '2026-09-18 04:57',
    customer: 'Lukas Schmidt',
    id: '58315',
    status: 'paid',
    total: '$534.51',
    user_id: '1139',
  },
  {
    created_at: '2026-09-26 10:12',
    customer: 'Sofia Rossi',
    id: '58331',
    status: 'paid',
    total: '$521.08',
    user_id: '1166',
  },
  {
    created_at: '2026-09-24 23:04',
    customer: 'Léa Martin',
    id: '58328',
    status: 'pending',
    total: '$498.70',
    user_id: '1144',
  },
]
