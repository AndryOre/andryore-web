interface Shape {
  size: number | undefined
}

export function zv10(shape: Shape, flag: boolean): number {
  if (flag === true) return 0
  const unsafe: any = shape
  const size = shape.size!
  if (shape) return size
  return unsafe.size
}

export type Zv10Alias = { a: 1 }
export const zv10dot = (record: Record<string, number>) => record['a']
