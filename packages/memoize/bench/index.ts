/* eslint-disable no-console */

import type { AnyFunction } from '../src/memoize'
import emotionMemoize from '@emotion/memoize'
import { memoize as fastMemoize } from '@formatjs/fast-memoize'
import lodashMemoize from 'lodash.memoize'
import memoizePkg from 'memoize'
import memoizee from 'memoizee'
import { memoize as conarMemoize } from '../src/memoize'

const TRIALS = 5
const WARMUP_ROUNDS = 10_000
const HIT_DATASET_SIZE = 256
const HIT_ROUNDS = 2_500
const MISS_COUNT = 50_000

// Keeps the JIT honest — prevents it from eliminating the memoized call.
let sink = 0
function blackhole(value: unknown) {
  sink ^= Number(value) | 0
}

interface Obj { id: number, tag: string, nested: { even: boolean, score: number } }

const nf = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const fmt = (n: number) => nf.format(n)
const fmtMs = (n: number) => `${fmt(n)} ms`

function median(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1]! + sorted[mid]!) / 2
    : sorted[mid]!
}

function avg(values: number[]) {
  let total = 0
  for (const v of values) total += v
  return total / values.length
}

// --- datasets -------------------------------------------------------------

function stringDataset(size: number): [string][] {
  return Array.from({ length: size }, (_, i) => [`key-${i % 61}-${i}`])
}

function missStringDataset(size: number): [string][] {
  return Array.from({ length: size }, (_, i) => [`miss-${i}-${i * 17}`])
}

function tupleDataset(size: number): [number, number][] {
  return Array.from({ length: size }, (_, i) => [i % 97, (i * 7) % 101])
}

function clonedObjectDataset(size: number): [Obj][] {
  return Array.from({ length: size }, (_, i) => [{
    id: i % 79,
    tag: `group-${i % 11}`,
    nested: { even: i % 2 === 0, score: (i * 13) % 17 },
  }])
}

// --- workloads ------------------------------------------------------------

function stringWorkload(input: string) {
  let total = 0
  for (let i = 0; i < input.length; i++)
    total += input.charCodeAt(i) * (i + 1)
  return total
}

const tupleWorkload = (a: number, b: number) => (a * 31) ^ (b * 17)

function objectWorkload(v: Obj) {
  return v.id * 101 + v.tag.length * 7 + (v.nested.even ? 1 : 0) + v.nested.score
}

// --- benchmark runner -----------------------------------------------------

interface Competitor {
  name: string
  factory: (fn: AnyFunction) => AnyFunction
  workload: AnyFunction
}

interface Result {
  name: string
  medianMs: number
  avgMs: number
  opsPerSecond: number
}

type Prepare = () => { memoized: AnyFunction }
type Run = (prepared: { memoized: AnyFunction }) => { operations: number }

function bench(name: string, prepare: Prepare, run: Run): Result {
  const samples: number[] = []
  let operations = 0

  for (let trial = 0; trial < TRIALS; trial++) {
    const prepared = prepare()
    const start = performance.now()
    const { operations: ops } = run(prepared)
    samples.push(performance.now() - start)
    operations = ops
  }

  const medianMs = median(samples)
  return {
    name,
    medianMs,
    avgMs: avg(samples),
    opsPerSecond: operations / (medianMs / 1000),
  }
}

function printSuite(title: string, rows: Result[], note?: string) {
  console.log(`\n# ${title}`)
  if (note)
    console.log(note)

  const sorted = [...rows].sort((a, b) => b.opsPerSecond - a.opsPerSecond)
  const fastest = sorted[0]!.opsPerSecond

  const w = {
    name: Math.max('Library'.length, ...sorted.map(r => r.name.length)),
    ops: Math.max('Median throughput'.length, ...sorted.map(r => `${fmt(r.opsPerSecond)} ops/s`.length)),
    time: Math.max('Median time'.length, ...sorted.map(r => fmtMs(r.medianMs).length)),
    rel: Math.max('vs fastest'.length, ...sorted.map(r => `${(fastest / r.opsPerSecond).toFixed(2)}x`.length)),
  }

  console.log([
    'Library'.padEnd(w.name),
    'Median throughput'.padStart(w.ops),
    'Median time'.padStart(w.time),
    'vs fastest'.padStart(w.rel),
  ].join(' | '))
  console.log([w.name, w.ops, w.time, w.rel].map(n => '-'.repeat(n)).join('-|-'))

  for (const r of sorted) {
    console.log([
      r.name.padEnd(w.name),
      `${fmt(r.opsPerSecond)} ops/s`.padStart(w.ops),
      fmtMs(r.medianMs).padStart(w.time),
      `${(fastest / r.opsPerSecond).toFixed(2)}x`.padStart(w.rel),
    ].join(' | '))
  }
}

function runCached(title: string, competitors: Competitor[], dataset: unknown[][], note?: string) {
  const results = competitors.map(c => bench(
    c.name,
    () => {
      const memoized = c.factory(c.workload)
      // Warmup so we measure steady-state cache hits, not insertion.
      for (let r = 0; r < WARMUP_ROUNDS; r++)
        blackhole(memoized(...dataset[r % dataset.length]!))
      return { memoized }
    },
    ({ memoized }) => {
      let ops = 0
      for (let r = 0; r < HIT_ROUNDS; r++) {
        for (let i = 0; i < dataset.length; i++) {
          blackhole(memoized(...dataset[i]!))
          ops++
        }
      }
      return { operations: ops }
    },
  ))

  printSuite(title, results, note)
}

function runMiss(title: string, competitors: Competitor[], dataset: unknown[][], note?: string) {
  const results = competitors.map(c => bench(
    c.name,
    () => ({ memoized: c.factory(c.workload) }),
    ({ memoized }) => {
      let ops = 0
      for (let i = 0; i < dataset.length; i++) {
        blackhole(memoized(...dataset[i]!))
        ops++
      }
      return { operations: ops }
    },
  ))

  printSuite(title, results, note)
}

// --- suites ---------------------------------------------------------------

const unaryString: Competitor[] = [
  { name: '@conar/memoize', factory: conarMemoize, workload: stringWorkload },
  { name: 'memoize', factory: memoizePkg, workload: stringWorkload },
  { name: 'lodash.memoize', factory: lodashMemoize, workload: stringWorkload },
  { name: 'memoizee', factory: fn => memoizee(fn), workload: stringWorkload },
  { name: '@emotion/memoize', factory: emotionMemoize, workload: stringWorkload },
  { name: '@formatjs/fast-memoize', factory: fastMemoize, workload: stringWorkload },
]

const variadic: Competitor[] = [
  { name: '@conar/memoize', factory: conarMemoize, workload: tupleWorkload },
  { name: 'memoize (cacheKey: JSON.stringify)', factory: fn => memoizePkg(fn, { cacheKey: JSON.stringify }), workload: tupleWorkload },
  { name: 'lodash.memoize (resolver)', factory: fn => lodashMemoize(fn, (...args: unknown[]) => JSON.stringify(args)), workload: tupleWorkload },
  { name: 'memoizee', factory: fn => memoizee(fn), workload: tupleWorkload },
  { name: '@formatjs/fast-memoize', factory: fastMemoize, workload: tupleWorkload },
]

const jsonStringify = JSON.stringify as (value: unknown) => string

const structuralObject: Competitor[] = [
  { name: '@conar/memoize', factory: conarMemoize, workload: objectWorkload },
  { name: 'memoize (cacheKey: JSON.stringify)', factory: fn => memoizePkg(fn, { cacheKey: JSON.stringify }), workload: objectWorkload },
  { name: 'lodash.memoize (resolver)', factory: fn => lodashMemoize(fn, jsonStringify), workload: objectWorkload },
  { name: 'memoizee (normalizer: JSON.stringify)', factory: fn => memoizee(fn, { normalizer: jsonStringify }), workload: objectWorkload },
  { name: '@formatjs/fast-memoize', factory: fastMemoize, workload: objectWorkload },
]

console.log('Memoization benchmark comparison')
console.log(`Trials per library: ${TRIALS}`)
console.log(`Hot-cache workload size: ${HIT_DATASET_SIZE} keys x ${HIT_ROUNDS} rounds`)
console.log(`Cold-miss workload size: ${MISS_COUNT} unique calls`)
console.log('')
console.log('Notes:')
console.log('- The libraries do not all share the same default cache-key semantics.')
console.log('- Suites below are split so each comparison is semantically fair.')
console.log('- @emotion/memoize only supports a single string argument, so it only appears in the unary string suites.')

runCached(
  'Unary string argument — hot cache hits',
  unaryString,
  stringDataset(HIT_DATASET_SIZE),
  'All libraries use their natural unary-string path here.',
)

runMiss(
  'Unary string argument — cold misses',
  unaryString,
  missStringDataset(MISS_COUNT),
  'Each call uses a unique string key, so this mainly reflects cache insertion overhead.',
)

runCached(
  'Two primitive arguments — hot cache hits',
  variadic,
  tupleDataset(HIT_DATASET_SIZE),
  'Libraries that need custom keying are configured to cache both arguments by value.',
)

runCached(
  'Single object argument by value — hot cache hits',
  structuralObject,
  clonedObjectDataset(HIT_DATASET_SIZE),
  'Every call receives a fresh object with the same structural value pattern; libraries are configured for by-value caching where needed.',
)

console.log(`\nblackhole=${sink}`)
