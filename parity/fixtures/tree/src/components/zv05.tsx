import { Button } from '@/components/ui/button'

export function Zv05() {
  return (
    <div>
      <Button className="text-red-500" />
      <div className="bg-red-500" />
      <div className="w-[13px]" />
      <div style={{ color: 'red' }} />
      <div className="zv-not-a-real-class" />
    </div>
  )
}
