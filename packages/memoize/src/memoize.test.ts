import { describe, expect, it, mock } from 'bun:test'
import { clearMemoizeCache, memoize } from './memoize'

describe('memoize', () => {
  it('should cache results for same primitive arguments', () => {
    const callback = mock((x: number) => x * 2)
    const fn = memoize(callback)

    expect(fn(5)).toBe(10)
    expect(fn(5)).toBe(10)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('should call function again for different primitive arguments', () => {
    const callback = mock((x: number) => x * 2)
    const fn = memoize(callback)

    expect(fn(5)).toBe(10)
    expect(fn(10)).toBe(20)
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('should handle multiple arguments with deep equality', () => {
    const callback = mock((a: { x: number }, b: { y: number }) => a.x + b.y)
    const fn = memoize(callback)

    expect(fn({ x: 1 }, { y: 2 })).toBe(3)
    expect(fn({ x: 1 }, { y: 2 })).toBe(3)
    expect(callback).toHaveBeenCalledTimes(1)
  })

  describe('transformArgs option', () => {
    it('should only use specified number of arguments for memoization', () => {
      const callback = mock((a: number, b: number, c: number) => a + b + c)
      const fn = memoize(callback, {
        transformArgs: (args: [number, number, number]) => args[0],
      })

      expect(fn(1, 2, 3)).toBe(6)
      expect(fn(1, 2, 99)).toBe(6)
      expect(callback).toHaveBeenCalledTimes(1)

      expect(fn(10, 2, 3)).toBe(15)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should handle objects with transformArgs', () => {
      const callback = mock((a: { id: number }, b: { name: string }) => `${a.id}-${b.name}`)
      const fn = memoize(callback, {
        transformArgs: (args: [{ id: number }, { name: string }]) => args[0],
      })

      expect(fn({ id: 1 }, { name: 'Alice' })).toBe('1-Alice')
      expect(fn({ id: 1 }, { name: 'Bob' })).toBe('1-Alice')
      expect(callback).toHaveBeenCalledTimes(1)

      expect(fn({ id: 2 }, { name: 'Alice' })).toBe('2-Alice')
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should allow custom property-based comparison via transformArgs', () => {
      const callback = mock((user: { id: number, name: string }) => user.id)

      const fn = memoize(callback, {
        transformArgs: (args: [{ id: number, name: string }]) => args[0].id,
      })

      expect(fn({ id: 1, name: 'Alice' })).toBe(1)
      expect(fn({ id: 1, name: 'Bob' })).toBe(1)
      expect(callback).toHaveBeenCalledTimes(1)

      expect(fn({ id: 2, name: 'Charlie' })).toBe(2)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should allow composite key via transformArgs', () => {
      const callback = mock((a: number, b: number) => a + b)

      const fn = memoize(callback, {
        transformArgs: ([a, b]) => `${a}-${b > 2}`,
      })

      expect(fn(1, 2)).toBe(3)
      expect(fn(1, 4)).toBe(5)
      expect(fn(1, 7)).toBe(5)
      expect(callback).toHaveBeenCalledTimes(2)

      expect(fn(2, 1)).toBe(3)
      expect(callback).toHaveBeenCalledTimes(3)
    })
  })

  describe('promise handling', () => {
    it('should cache resolved promises', async () => {
      const callback = mock(async (x: number) => {
        await new Promise(resolve => setTimeout(resolve, 1))
        return x * 2
      })
      const fn = memoize(callback)

      const result1 = await fn(5)
      const result2 = await fn(5)

      expect(result1).toBe(10)
      expect(result2).toBe(10)
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('should clear cache when promise rejects', async () => {
      const callback = mock(async (shouldFail: boolean) => {
        if (shouldFail) {
          throw new Error('Failed')
        }
        return 'success'
      })
      const fn = memoize(callback)

      await expect(fn(true)).rejects.toThrow('Failed')
      expect(callback).toHaveBeenCalledTimes(1)

      expect(fn(true)).rejects.toThrow('Failed')
      expect(callback).toHaveBeenCalledTimes(2)

      const result = await fn(false)
      expect(result).toBe('success')
      expect(callback).toHaveBeenCalledTimes(3)

      const cached = await fn(false)
      expect(cached).toBe('success')
      expect(callback).toHaveBeenCalledTimes(3)
    })
  })

  describe('clearMemoizeCache', () => {
    it('should clear cache for memoized function', () => {
      const callback = mock((x: number) => x * 2)
      const fn = memoize(callback)

      fn(5)
      fn(5)
      expect(callback).toHaveBeenCalledTimes(1)

      clearMemoizeCache(fn)

      fn(5)
      expect(callback).toHaveBeenCalledTimes(2)
    })

    it('should clear all cached entries', () => {
      const callback = mock((x: number) => x * 2)
      const fn = memoize(callback)

      fn(1)
      fn(2)
      fn(3)
      expect(callback).toHaveBeenCalledTimes(3)

      clearMemoizeCache(fn)

      fn(1)
      fn(2)
      fn(3)
      expect(callback).toHaveBeenCalledTimes(6)
    })

    it('should not throw for non-memoized function', () => {
      const regularFn = (x: number) => x * 2
      expect(() => clearMemoizeCache(regularFn)).not.toThrow()
    })

    it('should allow caching after clear', () => {
      const callback = mock((x: number) => x * 2)
      const fn = memoize(callback)

      fn(5)
      clearMemoizeCache(fn)
      fn(5)
      fn(5)
      expect(callback).toHaveBeenCalledTimes(2)
    })
  })
})
