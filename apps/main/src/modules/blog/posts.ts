import aPlaceToWriteThingsDown from './content/a-place-to-write-things-down.md?raw'
import connectToMysql from './content/connect-to-mysql.md?raw'
import connectToPostgresql from './content/connect-to-postgresql.md?raw'
import connectToSqlServer from './content/connect-to-sql-server.md?raw'

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
    slug: 'a-place-to-write-things-down',
    title: 'A place to write things down',
    description:
      'Why Tamery has a blog now, and what goes here instead of the changelog.',
    publishedAt: '2026-10-23',
    content: aPlaceToWriteThingsDown,
  },
].toSorted((a, b) => b.publishedAt.localeCompare(a.publishedAt))

export const findPost = (slug: string) =>
  blogPosts.find((post) => post.slug === slug)
