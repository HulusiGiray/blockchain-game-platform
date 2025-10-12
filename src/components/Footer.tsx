'use client'

import { usePathname } from 'next/navigation'

export default function Footer() {
  const pathname = usePathname()
  
  // Login sayfasında footer gösterme
  if (pathname === '/login') {
    return null
  }
  
  return (
    <footer className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-6 mt-auto">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm select-none">
          2025 © Powered by{' '}
          <span className="font-bold text-blue-400">SEN0401 Students</span>
        </p>
      </div>
    </footer>
  )
}



