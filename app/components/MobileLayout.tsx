'use client';

import { usePathname } from 'next/navigation'

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-gray-100 p-4">
        <h1 className="text-2xl font-bold">Image Processor</h1>
      </header>
      <main className="flex-grow p-4">
        {children}
      </main>
    </div>
  )
}