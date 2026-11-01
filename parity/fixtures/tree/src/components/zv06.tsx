import { useEffect, useState } from 'react'

export function Zv06({ id }: { id: number }) {
  const [value, setValue] = useState(0)
  if (id > 1) return null
  const [other] = useState(1)
  useEffect(() => {
    setValue(id)
  }, [])
  return <div>{value + other}</div>
}
