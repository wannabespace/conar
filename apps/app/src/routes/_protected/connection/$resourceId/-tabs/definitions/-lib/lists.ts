export const sameList = (left: string[], right: string[]) =>
  left.length === right.length &&
  left.every((item, index) => item === right[index])
