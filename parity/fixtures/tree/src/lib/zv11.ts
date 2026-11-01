import path from 'path'

export const zv11 = (items: number[]): number =>
  items.reduce((total, item) => total + item, 0) + path.sep.length

// @ts-ignore
export const zv11ignore: number = 'x'
