async function work(): Promise<number> {
  return await Promise.resolve(1)
}

export function zv09(): void {
  work()
  const record = {}
  const bad = `${record}`
  console.info(bad)
  ;[1].forEach(async () => {
    await work()
  })
}
