export interface Connection {
  protocol: string
  username: string
  password: string | null
  host: string
  port: number
  database: string
  options: string | null
}
