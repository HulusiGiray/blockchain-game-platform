'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import SendMessageModal from './SendMessageModal'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [balance, setBalance] = useState<number | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (session) {
      fetch('/api/user/balance')
        .then(res => res.json())
        .then(data => setBalance(data.totalPoints))
        .catch(console.error)
      
      // Admin ise okunmamış mesaj sayısını çek
      if (session.user.role === 'ADMIN') {
        const loadUnreadCount = () => {
          fetch('/api/messages/list')
            .then(res => res.json())
            .then(data => setUnreadCount(data.unreadCount || 0))
            .catch(console.error)
        }
        
        loadUnreadCount()
        // Her 30 saniyede bir güncelle
        const interval = setInterval(loadUnreadCount, 30000)
        return () => clearInterval(interval)
      }
    }
  }, [session])

  if (!session) return null

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-2 sm:px-4 py-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Logo / Başlık */}
          <div className="flex items-center">
            <div className="font-bold text-sm sm:text-base md:text-lg animate-pulse-slow bg-gradient-to-r from-white via-yellow-200 to-white bg-clip-text text-transparent">
              SEN0401 - Blockchain
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Kullanıcı Bilgisi - sadece geniş ekranlarda */}
            <div className="text-right hidden xl:block">
              <div className="font-semibold text-sm">{session.user.username}</div>
              <div className="text-xs opacity-80">
                {session.user.role === 'ADMIN' ? '👑 Admin' : '👤 Öğrenci'}
              </div>
              {session.user.role === 'STUDENT' && (
                <div className="text-xs opacity-70">
                  {session.user.email?.split('@')[0]}
                </div>
              )}
            </div>

          {/* Sorun Bildir Butonu (Öğrenciler için) */}
          {session.user.role === 'STUDENT' && (
            <button
              onClick={() => setShowMessageModal(true)}
              className="px-2 sm:px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 rounded-lg transition-colors font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <span className="hidden sm:inline">Sorun mu yaşıyorsun?</span>
              <span className="sm:hidden">💬</span>
              <span>❓</span>
            </button>
          )}

          {/* Mesajlar Butonu (Adminler için) */}
          {session.user.role === 'ADMIN' && (
            <Link
              href="/messages"
              className="relative px-2 sm:px-3 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg transition-colors font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-1"
            >
              <span className="hidden sm:inline">Mesajlar</span>
              <span>✉️</span>
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )}

          {/* Bonus Göstergesi */}
          <div className="flex items-center gap-1 bg-white/20 px-2 sm:px-3 py-1.5 rounded-lg backdrop-blur-sm">
            <span className="text-base sm:text-xl">💰</span>
            <div className="text-right">
              <div className="text-xs opacity-80 hidden sm:block">Bonus</div>
              <div className="text-sm sm:text-lg font-bold">
                {balance !== null ? balance : '...'}
              </div>
            </div>
          </div>

            {/* Çıkış Butonu */}
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="px-2 sm:px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg transition-colors font-medium text-xs sm:text-sm whitespace-nowrap flex items-center gap-1 cursor-pointer"
            >
              <span>Çıkış Yap</span>
              <span>🚪</span>
            </button>
          </div>
        </div>
        
        {/* Mesaj Gönderme Modalı */}
        {showMessageModal && (
          <SendMessageModal onClose={() => setShowMessageModal(false)} />
        )}

        {/* Ana Navigasyon - Her zaman görünür */}
        <nav className="flex gap-1.5 sm:gap-2 mt-3 overflow-x-auto">
          <Link 
            href="/game"
            className={`flex-1 text-center px-2 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
              pathname === '/game' 
                ? 'bg-white text-blue-600 font-semibold' 
                : 'bg-white/20'
            }`}
          >
            🎮 Oyun
          </Link>
          <Link 
            href="/leaderboard"
            className={`flex-1 text-center px-2 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
              pathname === '/leaderboard' 
                ? 'bg-white text-blue-600 font-semibold' 
                : 'bg-white/20'
            }`}
          >
            🏆 Liderlik
          </Link>
          <Link 
            href="/account"
            className={`flex-1 text-center px-2 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
              pathname === '/account' 
                ? 'bg-white text-blue-600 font-semibold' 
                : 'bg-white/20'
            }`}
          >
            👤 Hesabım
          </Link>
          {session.user.role === 'ADMIN' && (
            <Link 
              href="/admin"
              className={`flex-1 text-center px-2 py-2 rounded-lg transition-colors text-sm whitespace-nowrap ${
                pathname === '/admin' 
                  ? 'bg-yellow-400 text-gray-900 font-semibold' 
                  : 'bg-yellow-500 text-gray-900'
              }`}
            >
              ⚡ Admin
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}

