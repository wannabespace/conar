import { spawn } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'

import * as p from '@clack/prompts'
import { getPackages } from '@manypkg/get-packages'

const __dirname = import.meta.dirname
const rootDir = path.join(__dirname, '..')
const cacheFile = path.join(rootDir, 'node_modules', '.cache', 'tamery-run.json')

const ROOT_ID = '<root>'

interface WorkspacePackage {
  id: string
  name: string
  dir: string
  scripts: string[]
}

interface Selection {
  packages: string[]
  script: string
}

const readTurboTasks = () => {
  const turboJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'turbo.json'), 'utf-8'))

  return new Set(Object.keys(turboJson.tasks ?? {}).map(task => task.split('#').at(-1) as string))
}

const runnerFile = path.basename(import.meta.filename)

const discoverPackages = async (): Promise<WorkspacePackage[]> => {
  const { packages, rootPackage } = await getPackages(rootDir)

  const toWorkspacePackage = (pkg: (typeof packages)[number], isRoot: boolean) => ({
    dir: pkg.relativeDir,
    id: isRoot ? ROOT_ID : pkg.packageJson.name,
    name: pkg.packageJson.name,
    scripts: Object.entries(
      ('scripts' in pkg.packageJson ? pkg.packageJson.scripts : undefined) ?? {},
    )
      .filter(([, command]) => !command.includes(runnerFile))
      .map(([name]) => name),
  })

  return [
    ...(rootPackage ? [toWorkspacePackage(rootPackage, true)] : []),
    ...packages
      .filter(pkg => pkg.dir !== rootPackage?.dir)
      .map(pkg => toWorkspacePackage(pkg, false)),
  ].filter(pkg => pkg.scripts.length > 0)
}

function readCache(): Selection | null {
  try {
    return JSON.parse(fs.readFileSync(cacheFile, 'utf-8'))
  } catch {
    return null
  }
}

function writeCache(selection: Selection) {
  fs.mkdirSync(path.dirname(cacheFile), { recursive: true })
  fs.writeFileSync(cacheFile, JSON.stringify(selection, null, 2))
}

function parseArgs(argv: string[]) {
  const separator = argv.indexOf('--')
  const own = separator === -1 ? argv : argv.slice(0, separator)
  const forwarded = separator === -1 ? [] : argv.slice(separator + 1)
  const flags = new Set(own.filter(arg => arg.startsWith('-')))

  return {
    all: flags.has('--all') || flags.has('-a'),
    dryRun: flags.has('--dry-run') || flags.has('-d'),
    forwarded,
    last: flags.has('--last') || flags.has('-l'),
    noTurbo: flags.has('--no-turbo'),
    script: own.find(arg => !arg.startsWith('-')),
  }
}

function run(command: string, args: string[]) {
  p.log.step(`${command} ${args.join(' ')}`)

  const child = spawn(command, args, {
    cwd: rootDir,
    shell: process.platform === 'win32',
    stdio: 'inherit',
  })

  child.on('exit', (code, signal) => {
    process.exit(signal ? 1 : (code ?? 0))
  })
  child.on('error', error => {
    p.log.error(error.message)
    process.exit(1)
  })
}

function buildCommand(
  selected: WorkspacePackage[],
  script: string,
  options: { turbo: boolean; forwarded: string[] },
) {
  const onlyRoot = selected.length === 1 && selected[0]!.id === ROOT_ID

  if (onlyRoot) {
    return { args: ['run', script, ...options.forwarded], command: 'pnpm' }
  }

  const filters = selected.filter(pkg => pkg.id !== ROOT_ID)

  if (options.turbo) {
    return {
      args: [
        'exec',
        'turbo',
        'run',
        script,
        ...filters.map(pkg => `--filter=${pkg.name}`),
        ...(options.forwarded.length > 0 ? ['--', ...options.forwarded] : []),
      ],
      command: 'pnpm',
    }
  }

  return {
    args: [
      ...filters.flatMap(pkg => ['--filter', pkg.name]),
      ...(filters.length > 1 ? ['--parallel'] : []),
      'run',
      script,
      ...options.forwarded,
    ],
    command: 'pnpm',
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const discovered = await discoverPackages()
  const packages = args.script
    ? discovered.filter(pkg => pkg.scripts.includes(args.script!))
    : discovered
  const cached = args.last ? readCache() : null

  p.intro('tamery · run workspace scripts')

  if (packages.length === 0) {
    p.cancel(`No package has a script named "${args.script}"`)
    return process.exit(1)
  }

  let selectedIds: string[]

  if (args.all) {
    selectedIds = packages.filter(pkg => pkg.id !== ROOT_ID).map(pkg => pkg.id)
  } else if (cached) {
    selectedIds = cached.packages.filter(id => packages.some(pkg => pkg.id === id))
  } else {
    const remembered = readCache()?.packages.filter(id => packages.some(pkg => pkg.id === id)) ?? []

    const answer = await p.multiselect({
      initialValues:
        remembered.length > 0
          ? remembered
          : args.script
            ? packages.filter(pkg => pkg.id !== ROOT_ID).map(pkg => pkg.id)
            : [],
      message: args.script ? `Select packages to run "${args.script}" in` : 'Select packages',
      options: packages.map(pkg => ({
        hint: pkg.dir,
        label: pkg.id === ROOT_ID ? 'root' : pkg.name,
        value: pkg.id,
      })),
      required: true,
    })

    if (p.isCancel(answer)) {
      p.cancel('Cancelled')
      return process.exit(0)
    }

    selectedIds = answer
  }

  const selected = packages.filter(pkg => selectedIds.includes(pkg.id))

  if (selected.length === 0) {
    p.cancel('No packages selected')
    return process.exit(1)
  }

  const scriptCounts = new Map<string, number>()

  for (const pkg of selected) {
    for (const name of pkg.scripts) {
      scriptCounts.set(name, (scriptCounts.get(name) ?? 0) + 1)
    }
  }

  let script =
    args.script ?? (cached?.script && scriptCounts.has(cached.script) ? cached.script : undefined)

  if (script && !scriptCounts.has(script)) {
    p.cancel(`No selected package has a script named "${script}"`)
    return process.exit(1)
  }

  if (!script) {
    const answer = await p.select({
      initialValue: cached?.script,
      message: 'Select script',
      options: [...scriptCounts.keys()].toSorted().map(name => ({
        hint: `${scriptCounts.get(name)}/${selected.length} packages`,
        label: name,
        value: name,
      })),
    })

    if (p.isCancel(answer)) {
      p.cancel('Cancelled')
      return process.exit(0)
    }

    script = answer
  }

  const targets = selected.filter(pkg => pkg.scripts.includes(script))
  const skipped = selected.filter(pkg => !pkg.scripts.includes(script))

  if (skipped.length > 0) {
    p.log.warn(`Skipping (no "${script}" script): ${skipped.map(pkg => pkg.name).join(', ')}`)
  }

  writeCache({ packages: targets.map(pkg => pkg.id), script })

  const isTurboTask = readTurboTasks().has(script)

  if (!isTurboTask && !args.noTurbo) {
    p.log.warn(`"${script}" is not a turbo.json task — running through pnpm instead`)
  }

  const { command, args: commandArgs } = buildCommand(targets, script, {
    forwarded: args.forwarded,
    turbo: isTurboTask && !args.noTurbo,
  })

  p.outro(`Running "${script}" in ${targets.length} package${targets.length === 1 ? '' : 's'}`)

  if (args.dryRun) {
    console.log(`${command} ${commandArgs.join(' ')}`)
    return
  }

  run(command, commandArgs)
}

main()
