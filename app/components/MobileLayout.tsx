'use client';

import { useState, useEffect } from 'react'
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function MobileLayout({ children }: { children: React.ReactNode }) {
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
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-100 p-4">
        <h1 className="text-2xl font-bold">Image Processor</h1>
      </header>
      <main className="flex-grow p-4">
        {children}
      </main>
      <footer className="bg-gray-100 p-4">
        <div className="flex items-center justify-center space-x-2">
          <Switch
            id="remove-bg"
            checked={removeBg}
            onCheckedChange={handleRemoveBgChange}
          />
          <Label htmlFor="remove-bg">Remove Background</Label>
        </div>
      </footer>
    </div>
  )
}