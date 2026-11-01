export function zv03(event: Event, props: string, doc: string): string {
  const btn = event.type
  const e = props + doc
  return btn + e
}
