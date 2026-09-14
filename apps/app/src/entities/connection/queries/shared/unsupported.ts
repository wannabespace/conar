export const unsupported = (feature: string) => () => {
  throw new Error(`${feature} is not supported for this database`)
}
