import connectToClickhouse from './content/connect-to-clickhouse.md?raw'
import connectToCloudflareD1 from './content/connect-to-cloudflare-d1.md?raw'
import connectToMysql from './content/connect-to-mysql.md?raw'
import connectToOracle from './content/connect-to-oracle.md?raw'
import connectToPostgresql from './content/connect-to-postgresql.md?raw'
import connectToSqlServer from './content/connect-to-sql-server.md?raw'
import connectToSqlite from './content/connect-to-sqlite.md?raw'
import connectToTurso from './content/connect-to-turso.md?raw'

export const BLOG_AUTHOR = 'Valerii Strilets'

export interface BlogPost {
  slug: string
  title: string
  description: string
  publishedAt: string
  content: string
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'connect-to-sql-server',
    title: 'How to connect to SQL Server',
    description:
      'Connect to Microsoft SQL Server or Azure SQL: the connection string, trusted connections vs SQL authentication, and the sa account.',
    publishedAt: '2026-10-24',
    content: connectToSqlServer,
  },
  {
    slug: 'connect-to-postgresql',
    title: 'How to connect to PostgreSQL',
    description:
      'Connect to PostgreSQL, including Supabase, Neon and Railway: the connection string, poolers, placeholder passwords and SSL modes.',
    publishedAt: '2026-10-24',
    content: connectToPostgresql,
  },
  {
    slug: 'connect-to-mysql',
    title: 'How to connect to MySQL and MariaDB',
    description:
      'Connect to MySQL or MariaDB: URL, Go DSN and .env formats, SSL options, and fixing authentication plugin errors.',
    publishedAt: '2026-10-24',
    content: connectToMysql,
  },
  {
    slug: 'connect-to-oracle',
    title: 'How to connect to Oracle Database',
    description:
      'Connect to Oracle: the connection string and JDBC URL, the service name, schemas, TCPS encryption and the limits to know.',
    publishedAt: '2026-10-24',
    content: connectToOracle,
  },
  {
    slug: 'connect-to-clickhouse',
    title: 'How to connect to ClickHouse',
    description:
      'Connect to ClickHouse Cloud or a self-hosted server over HTTP: the right ports, the HTTPS string, and what differs from a row store.',
    publishedAt: '2026-10-24',
    content: connectToClickhouse,
  },
  {
    slug: 'connect-to-sqlite',
    title: 'How to connect to SQLite',
    description:
      'Open a SQLite database file in Tamery: drag and drop, paths and schemes, and how to reach a local file from the web app.',
    publishedAt: '2026-10-24',
    content: connectToSqlite,
  },
  {
    slug: 'connect-to-turso',
    title: 'How to connect to Turso',
    description:
      'Connect to Turso (libSQL): the database URL and auth token, self-hosted servers, and the one difference from local SQLite.',
    publishedAt: '2026-10-24',
    content: connectToTurso,
  },
  {
    slug: 'connect-to-cloudflare-d1',
    title: 'How to connect to Cloudflare D1',
    description:
      'Connect to Cloudflare D1: account ID, database ID and the API token to create, plus the two D1 quirks worth knowing.',
    publishedAt: '2026-10-24',
    content: connectToCloudflareD1,
  },
].toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export const findPost = (slug: string) =>
  blogPosts.find((post) => post.slug === slug)
