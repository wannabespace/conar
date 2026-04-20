import { describe, expect, it, mock } from 'bun:test'
import { clearMemoizeCache, getCacheStore, memoize } from './memoize'

describe('memoize', () => {
  it('caches results for equal arguments and recomputes for different ones', () => {
    const callback = mock((x: number) => x * 2)
    const fn = memoize(callback)

    expect(fn(5)).toBe(10)
    expect(fn(5)).toBe(10)
    expect(fn(10)).toBe(20)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('supports multiple object arguments by structural equality', () => {
    const callback = mock((a: { x: number }, b: { y: number }) => a.x + b.y)
    const fn = memoize(callback)

    expect(fn({ x: 1 }, { y: 2 })).toBe(3)
    expect(fn({ x: 1 }, { y: 2 })).toBe(3)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  describe('transformArgs option', () => {
    it('reduces the key to a subset of arguments', () => {
      const callback = mock((a: number, b: number, c: number) => a + b + c)
      const fn = memoize(callback, {
        transformArgs: ([firstArg]) => firstArg,
      })

      expect(fn(1, 2, 3)).toBe(6)
      expect(fn(1, 2, 99)).toBe(6)
      expect(fn(10, 2, 3)).toBe(15)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('allows a custom composite key', () => {
      const callback = mock((a: number, b: number) => a + b)
      const fn = memoize(callback, {
        transformArgs: ([a, b]) => `${a}-${b > 2}`,
      })

      expect(fn(1, 2)).toBe(3)
      expect(fn(1, 4)).toBe(5)
      expect(fn(1, 7)).toBe(5)
      expect(fn(2, 1)).toBe(3)
      expect(callback).toHaveBeenCalledTimes(3)
    })
  })

  describe('promise handling', () => {
    it('caches resolved promises', async () => {
      const callback = mock(async (x: number) => x * 2)
      const fn = memoize(callback)

      expect(await fn(5)).toBe(10)
      expect(await fn(5)).toBe(10)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('evicts the entry when the promise rejects', async () => {
      const callback = mock(async (shouldFail: boolean) => {
        if (shouldFail)
          throw new Error('Failed')
        return 'success'
      })
      const fn = memoize(callback)

      await expect(fn(true)).rejects.toThrow('Failed')
      expect(fn(true)).rejects.toThrow('Failed')
      expect(callback).toHaveBeenCalledTimes(2)

      expect(await fn(false)).toBe('success')
      expect(await fn(false)).toBe('success')
      expect(callback).toHaveBeenCalledTimes(3)
    })
  })

  describe('clearMemoizeCache', () => {
    it('clears cached entries so the function is called again', () => {
      const callback = mock((x: number) => x * 2)
      const fn = memoize(callback)

      fn(1)
      fn(2)
      fn(1)
      expect(callback).toHaveBeenCalledTimes(2)

      clearMemoizeCache(fn)

      fn(1)
      fn(2)
      expect(callback).toHaveBeenCalledTimes(4)
    })

    it('is a no-op for non-memoized functions', () => {
      const regularFn = (x: number) => x * 2
      expect(() => clearMemoizeCache(regularFn)).not.toThrow()
    })

    it('clears both stores', () => {
      class Point { constructor(public x: number) {} }
      // eslint-disable-next-line ts/no-explicit-any
      const fn = memoize(mock((x: any) => x))
      const pointRef = new Point(1)

      fn({ id: 1 })
      fn(pointRef)

      const store = getCacheStore(fn)!
      expect(store.cache.size).toBe(1)
      expect(store.fallbackEntries.length).toBe(1)

      clearMemoizeCache(fn)

      expect(store.cache.size).toBe(0)
      expect(store.fallbackEntries.length).toBe(0)
    })
  })

  describe('serialisable keys', () => {
    it('distinguishes values that share a string form', () => {
      // eslint-disable-next-line ts/no-explicit-any
      const callback = mock((x: any) => x)
      const fn = memoize(callback)

      fn(1)
      fn('1')
      fn(true)
      fn(null)
      fn('null')
      fn(undefined)
      expect(callback).toHaveBeenCalledTimes(6)
    })

    it('treats NaN as equal to itself', () => {
      const callback = mock((x: number) => x)
      const fn = memoize(callback)

      fn(Number.NaN)
      fn(Number.NaN)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('memoizes Date, RegExp, Map, Set, and BigInt keys', () => {
      // eslint-disable-next-line ts/no-explicit-any
      const callback = mock((_: any) => 'ok')
      const fn = memoize(callback)

      fn(new Date(1000))
      fn(new Date(1000))
      fn(/foo/g)
      fn(/foo/g)
      fn(new Map([['a', 1]]))
      fn(new Map([['a', 1]]))
      fn(new Set([1, 2, 3]))
      fn(new Set([1, 2, 3]))
      fn(10n)
      fn(10n)

      expect(callback).toHaveBeenCalledTimes(5)
    })

    it('scales to many distinct entries', () => {
      const callback = mock((x: { id: number }) => x.id)
      const fn = memoize(callback)
      const N = 5000

      for (let i = 0; i < N; i++) fn({ id: i })
      for (let i = 0; i < N; i++) fn({ id: i })

      expect(callback).toHaveBeenCalledTimes(N)
      const store = getCacheStore(fn)!
      expect(store.cache.size).toBe(N)
      expect(store.fallbackEntries.length).toBe(0)
    })

    it('handles cyclic keys via devalue without crashing', () => {
      // eslint-disable-next-line ts/no-explicit-any
      const cyclic: any = { a: 1 }
      cyclic.self = cyclic

      // eslint-disable-next-line ts/no-explicit-any
      const callback = mock((obj: any) => obj.a)
      const fn = memoize(callback)

      expect(() => fn(cyclic)).not.toThrow()
      expect(fn(cyclic)).toBe(1)
      expect(callback).toHaveBeenCalledTimes(1)
    })
  })

  describe('unserialisable keys (by reference identity)', () => {
    class Point { constructor(public x: number) {} }

    it('memoizes class-instance keys by reference identity', () => {
      // eslint-disable-next-line ts/no-explicit-any
      const callback = mock((_: any) => 'ok')
      const fn = memoize(callback)

      const p = new Point(1)
      fn(p)
      fn(p)
      expect(callback).toHaveBeenCalledTimes(1)

      fn(new Point(1))
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('memoizes function-valued keys by reference identity', () => {
      const shared = () => 1
      // eslint-disable-next-line ts/no-explicit-any
      const callback = mock((_: any) => 'ok')
      const fn = memoize(callback)

      fn(shared)
      fn(shared)
      expect(callback).toHaveBeenCalledTimes(1)

      fn(() => 1)
      expect(callback).toHaveBeenCalledTimes(2)
    })
  })
})
