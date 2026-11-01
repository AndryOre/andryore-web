export function Zv07() {
  return (
    <div>
      <img src="/a.png" />
      {[1, 2].map((n) => (
        <li>{n}</li>
      ))}
      <div onClick={() => undefined} />
    </div>
  )
}
