export interface Connection {
  id: string
  connectionString: string
  name?: string
}

export interface KeyDetails {
  type: string
  ttl: number
  value: unknown
}
