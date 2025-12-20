import { describe, expect, it } from 'bun:test'
import { tries } from './tries'

describe('tries', () => {
  it('should return the result of the first function when it succeeds', async () => {
    const result = await tries(
      () => 'success',
      () => 'fallback success'
    )

    expect(result).toBe('success')
  })

  it('should return the result of the second function when the first fails', async () => {
    const result = await tries(
      () => {
        throw new Error('first failed')
      },
      () => 'fallback success'
    )

    expect(result).toBe('fallback success')
  })

  it('should throw the last error when all functions fail', async () => {
    const lastError = new Error('last error')

    expect(
      tries(
        () => {
          throw new Error('first failed')
        },
        () => {
          throw new Error('second failed')
        },
        () => {
          throw lastError
        }
      )
    ).rejects.toThrow('last error')
  })

  it('should work with async functions', async () => {
    const result = await tries(
      async () => {
        throw new Error('first failed')
      },
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 10))
        return 'async success'
      }
    )

    expect(result).toBe('async success')
  })

  it('should handle functions that return different types', async () => {
    const result1 = await tries(
      () => {
        throw new Error('failed')
      },
      () => 'string'
    )
    expect(result1).toBe('string')

    const result2 = await tries(
      () => {
        throw new Error('failed')
      },
      () => 123
    )
    expect(result2).toBe(123)

    const result3 = await tries(
      () => {
        throw new Error('failed')
      },
      () => true
    )
    expect(result3).toBe(true)
  })

  it('should preserve error types', async () => {
    class CustomError extends Error {
      constructor(message: string) {
        super(message)
        this.name = 'CustomError'
      }
    }

    const customError = new CustomError('custom error')

    expect(
      tries(
        () => {
          throw new Error('first failed')
        },
        () => {
          throw customError
        }
      )
    ).rejects.toThrow(CustomError)
  })

  describe('when try is optional', () => {
    it('should skip undefined functions', async () => {
      const result = await tries(undefined, () => 'success')

      expect(result).toBe('success')
    })

    it('should skip false functions', async () => {
      const result = await tries(false, () => 'success')

      expect(result).toBe('success')
    })

    it('should skip undefined and false functions and use the first valid function', async () => {
      const result = await tries(
        undefined,
        false,
        () => {
          throw new Error('first valid failed')
        },
        () => 'second valid success'
      )

      expect(result).toBe('second valid success')
    })

    it('should work when the first function is undefined and second succeeds', async () => {
      const result = await tries(undefined, () => 'success')

      expect(result).toBe('success')
    })

    it('should work when the first function is false and second succeeds', async () => {
      const result = await tries(false, () => 'success')

      expect(result).toBe('success')
    })

    it('should work when functions are undefined at various positions', async () => {
      const result = await tries(
        () => {
          throw new Error('first failed')
        },
        undefined,
        () => 'success',
        undefined
      )

      expect(result).toBe('success')
    })

    it('should throw error when all functions are optional (undefined/false)', async () => {
      expect(tries(undefined, false, undefined)).rejects.toThrow('No functions to try')
    })

    it('should handle mixed optional and valid functions with errors', async () => {
      const lastError = new Error('last error')

      expect(
        tries(
          undefined,
          () => {
            throw new Error('first valid failed')
          },
          false,
          () => {
            throw lastError
          }
        )
      ).rejects.toThrow('last error')
    })
  })
})
