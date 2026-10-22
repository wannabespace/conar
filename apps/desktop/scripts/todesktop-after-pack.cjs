const { execFile } = require('node:child_process')
const { createHash } = require('node:crypto')
const { createReadStream, createWriteStream, existsSync } = require('node:fs')
const { chmod, cp, mkdir, mkdtemp, rm } = require('node:fs/promises')
const os = require('node:os')
const path = require('node:path')
const { Readable } = require('node:stream')
const { pipeline } = require('node:stream/promises')
const { promisify } = require('node:util')

const run = promisify(execFile)

// Must stay afterPack: it runs before signing, and macOS refuses to run an unsigned tool from a notarized app.
// `src/main/copy-database.ts` reads the tools from `<resources>/postgres/bin`; keep the two in sync.
const VERSION = '18.6-1'

const LICENSES = [
  ['pgsql/server_license.txt', 'server_license.txt'],
  [
    'pgsql/commandlinetools_3rd_party_licenses.txt',
    'commandlinetools_3rd_party_licenses.txt',
  ],
]

const ARCHIVES = {
  darwin: {
    files: [
      'bin/pg_dump',
      'bin/psql',
      'lib/libcom_err.3.0.dylib',
      'lib/libcrypto.3.dylib',
      'lib/libedit.0.dylib',
      'lib/libgssapi_krb5.2.2.dylib',
      'lib/libk5crypto.3.1.dylib',
      'lib/libkrb5.3.3.dylib',
      'lib/libkrb5support.1.1.dylib',
      'lib/liblz4.1.10.0.dylib',
      'lib/libpq.5.dylib',
      'lib/libssl.3.dylib',
      'lib/libz.1.3.2.dylib',
      'lib/libzstd.1.dylib',
    ].map((file) => [`pgsql/${file}`, file]),
    name: 'osx',
    sha256: '2a6739fccbbc36474cb2446e4e7b4f377abb8471653d3a294e4e5092271e4796',
  },
  win32: {
    files: [
      ...[
        'libcrypto-3-x64.dll',
        'libiconv-2.dll',
        'libintl-9.dll',
        'liblz4.dll',
        'libpq.dll',
        'libssl-3-x64.dll',
        'libwinpthread-1.dll',
        'libzstd.dll',
        'pg_dump.exe',
        'psql.exe',
      ].map((file) => [`pgsql/bin/${file}`, `bin/${file}`]),
      // The binaries link the MSVC runtime, which a clean Windows lacks; EDB ships it only beside pgAdmin.
      ['pgsql/pgAdmin 4/python/vcruntime140.dll', 'bin/vcruntime140.dll'],
    ],
    name: 'windows-x64',
    sha256: 'fbe23da234ee31547bf8a36d29dfd81e82b849df2d2b78d2eecb43d360252f8c',
  },
}

const LIPO_ARCHS = { 1: 'x86_64', 3: 'arm64' }

const sha256 = async (file) => {
  const hash = createHash('sha256')
  await pipeline(createReadStream(file), hash)
  return hash.digest('hex')
}

const download = async (archive) => {
  const file = path.join(
    os.tmpdir(),
    `postgresql-${VERSION}-${archive.name}-binaries.zip`
  )
  if (existsSync(file) && (await sha256(file)) === archive.sha256) {
    return file
  }
  const response = await fetch(
    `https://get.enterprisedb.com/postgresql/postgresql-${VERSION}-${archive.name}-binaries.zip`
  )
  if (!response.ok || !response.body) {
    throw new Error(`PostgreSQL tools download failed: ${response.status}`)
  }
  await pipeline(Readable.fromWeb(response.body), createWriteStream(file))
  const actual = await sha256(file)
  if (actual !== archive.sha256) {
    throw new Error(`PostgreSQL tools checksum mismatch: ${actual}`)
  }
  return file
}

module.exports = async function toDesktopAfterPack({
  appOutDir,
  arch,
  electronPlatformName,
  packager,
}) {
  const archive = ARCHIVES[electronPlatformName]
  if (!archive) {
    return
  }
  const zip = await download(archive)
  const extracted = await mkdtemp(path.join(os.tmpdir(), 'postgresql-'))
  const entries = [...archive.files, ...LICENSES]
  // Windows' own bsdtar reads zip; a GNU tar earlier on PATH (Git's) does not.
  const tar =
    process.platform === 'win32'
      ? path.join(process.env.SystemRoot, 'System32', 'tar.exe')
      : 'tar'
  await run(tar, [
    '-xf',
    zip,
    '-C',
    extracted,
    ...entries.map(([from]) => from),
  ])

  const resources =
    electronPlatformName === 'darwin'
      ? path.join(
          appOutDir,
          `${packager.appInfo.productFilename}.app`,
          'Contents',
          'Resources'
        )
      : path.join(appOutDir, 'resources')
  const destination = path.join(resources, 'postgres')
  await Promise.all(
    entries.map(async ([from, to]) => {
      const target = path.join(destination, to)
      await mkdir(path.dirname(target), { recursive: true })
      await cp(path.join(extracted, from), target)
      if (to.startsWith('bin/')) {
        await chmod(target, 0o755)
      }
      if (
        LIPO_ARCHS[arch] &&
        electronPlatformName === 'darwin' &&
        !to.endsWith('.txt')
      ) {
        await run('lipo', [
          target,
          '-thin',
          LIPO_ARCHS[arch],
          '-output',
          target,
        ])
      }
    })
  )
  await rm(extracted, { force: true, recursive: true })
}
