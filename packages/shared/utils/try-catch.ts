interface Success<T> {
  data: T
  error: null
}

interface Failure<E> {
  data: null
  error: E
}

type Result<T, E = Error> = Success<T> | Failure<E>

export async function tryCatch<T, E = Error>(
  func: () => Promise<T>,
): Promise<Result<T, E>> {
  try {
    const data = await func()
    return { data, error: null }
  }
  catch (error) {
    return { data: null, error: error as E }
  }
}
