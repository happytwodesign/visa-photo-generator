import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/router'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function StartingPage() {
  const router = useRouter()
  const [removeBg, setRemoveBg] = useState(false)

  useEffect(() => {
    const storedRemoveBg = localStorage.getItem('removeBg')
    if (storedRemoveBg !== null) {
      setRemoveBg(JSON.parse(storedRemoveBg))
    }
  }, [])

  const handleRemoveBgChange = (checked: boolean) => {
    setRemoveBg(checked)
    localStorage.setItem('removeBg', JSON.stringify(checked))
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Welcome to Image Processor</h1>
      
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Requirements:</h2>
        <ul className="list-disc list-inside">
          <li>Image must be in JPG, PNG, or WEBP format</li>
          <li>Image size should not exceed 10MB</li>
          <li>Minimum resolution: 512x512 pixels</li>
        </ul>
      </div>

      <div className="flex items-center space-x-2 mb-4">
        <Switch
          id="remove-bg"
          checked={removeBg}
          onCheckedChange={handleRemoveBgChange}
        />
        <Label htmlFor="remove-bg">Remove Background</Label>
      </div>

      <Button onClick={() => router.push('/upload')}>Start</Button>
    </div>
  )
}