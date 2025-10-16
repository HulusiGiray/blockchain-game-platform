'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import Header from '@/components/Header'
import LostKeyGame from '@/components/games/LostKeyGame'
import LostKeyGameControl from '@/components/admin/LostKeyGameControl'

type GameState = {
  status: 'loading' | 'waiting' | 'lobby' | 'active'
  message?: string
  game?: {
    id: string
    code: string
    title: string
    description: string
    config: any
    weekNo: number
    hasSubmitted: boolean
    submission: any
  }
  lobbyData?: {
    gameInstanceId: string
    gameTitle: string
    weekNo: number
    isUserInWaiting: boolean
    waiting: Array<{
      userId: string
      username: string
      studentNumber: string
      joinedAt: string
      isReady: boolean
    }>
  }
}

export default function GamePage() {
  const { data: session } = useSession()
  const [gameState, setGameState] = useState<GameState>({ status: 'loading' })

  const loadGame = async () => {
    try {
      // Önce waiting room kontrolü
      const lobbyRes = await fetch('/api/game/waiting-room')
      const lobbyData = await lobbyRes.json()
      
      // Eğer scheduled oyun varsa
      if (lobbyData.gameInstanceId) {
        setGameState({
          status: 'lobby',
          lobbyData
        })
        return
      }

      // Aktif oyun kontrolü
      const gameRes = await fetch('/api/game/current')
      const gameData = await gameRes.json()
      
      setGameState(gameData)
    } catch (err) {
      console.error(err)
      setGameState({ status: 'waiting', message: 'Oyun yüklenirken hata oluştu' })
    }
  }

  const joinWaiting = async () => {
    try {
      const res = await fetch('/api/game/join-waiting', {
        method: 'POST'
      })
      if (res.ok) {
        loadGame() // Yeniden yükle
      }
    } catch (error) {
      console.error('Lobiye katılma hatası:', error)
    }
  }

  useEffect(() => {
    if (session) {
      loadGame()
      // Her 10 saniyede bir kontrol et
      const interval = setInterval(loadGame, 10000)
      return () => clearInterval(interval)
    }
  }, [session])

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        {gameState.status === 'loading' && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">Oyun yükleniyor...</p>
          </div>
        )}

        {gameState.status === 'lobby' && gameState.lobbyData && (
          <div className="max-w-2xl mx-auto px-2 sm:px-0">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8">
              {gameState.lobbyData.isUserInWaiting ? (
                <>
                  {/* Kullanıcı Lobide */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">✅</div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Hazırsınız!</h2>
                    <p className="text-sm sm:text-base text-gray-600">
                      {gameState.lobbyData.gameTitle} - Hafta {gameState.lobbyData.weekNo}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-2">
                      Admin oyunu başlattığında otomatik olarak yönlendirileceksiniz
                    </p>
                  </div>

                  {/* Lobideki Diğer Kullanıcılar */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg sm:rounded-xl p-4 sm:p-6 border-2 border-blue-200">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <span className="text-2xl">👥</span>
                      Lobide Bekleyenler ({gameState.lobbyData.waiting.length} kişi)
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {gameState.lobbyData.waiting.map((user, idx) => (
                        <div 
                          key={user.userId}
                          className={`flex items-center justify-between p-3 rounded-lg ${
                            user.userId === session?.user.id 
                              ? 'bg-green-100 border-2 border-green-300' 
                              : 'bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                              {idx + 1}
                            </div>
                            <div>
                              <div className="font-medium text-gray-800">{user.username}</div>
                              <div className="text-xs text-gray-500">{user.studentNumber}</div>
                            </div>
                          </div>
                          {user.userId === session?.user.id && (
                            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">
                              Siz
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <div className="animate-pulse flex gap-2 justify-center">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Admin oyunu başlatması bekleniyor...</p>
                  </div>
                </>
              ) : (
                <>
                  {/* Kullanıcı Henüz Katılmadı */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-4xl sm:text-5xl md:text-6xl mb-3 sm:mb-4">🎮</div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">Oyun Hazırlanıyor!</h2>
                    <p className="text-sm sm:text-base text-gray-600 mb-2">
                      {gameState.lobbyData.gameTitle} - Hafta {gameState.lobbyData.weekNo}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      Admin henüz oyunu başlatmadı. Lobiye katılarak hazır olun!
                    </p>
                  </div>

                  <button
                    onClick={joinWaiting}
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 sm:py-4 rounded-lg sm:rounded-xl font-bold text-base sm:text-lg hover:from-green-700 hover:to-emerald-700 transition shadow-lg mb-4 sm:mb-6"
                  >
                    🎮 Lobiye Katıl
                  </button>

                  {gameState.lobbyData.waiting.length > 0 && (
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <p className="text-sm text-gray-600 text-center mb-3">
                        💡 {gameState.lobbyData.waiting.length} kişi zaten lobide bekliyor
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {gameState.lobbyData.waiting.slice(0, 5).map((user) => (
                          <span key={user.userId} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                            {user.username}
                          </span>
                        ))}
                        {gameState.lobbyData.waiting.length > 5 && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-600 rounded-full text-xs font-medium">
                            +{gameState.lobbyData.waiting.length - 5} kişi daha
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {gameState.status === 'waiting' && (
          <div className="max-w-2xl mx-auto px-2 sm:px-0">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8 md:p-12 text-center">
              {session?.user.role === 'ADMIN' ? (
                <>
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">⚡</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                    Henüz Oyun Yok
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-4 sm:mb-6">
                    Yeni bir oyun başlatmak için Admin Panel'i kullanın
                  </p>
                  <a
                    href="/admin"
                    className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg sm:rounded-xl font-bold text-sm sm:text-base hover:from-yellow-600 hover:to-orange-600 transition shadow-lg"
                  >
                    <span className="text-xl sm:text-2xl">⚡</span>
                    <span>Admin Panel'e Git</span>
                  </a>
                </>
              ) : (
                <>
                  <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">⏳</div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
                    Admin Bekleniyor
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg text-gray-600">
                    {gameState.message || "Admin henüz oyunu başlatmadı. Lütfen bekleyin..."}
                  </p>
                  <div className="mt-8 flex justify-center">
                    <div className="animate-pulse flex gap-2">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <div className="w-3 h-3 bg-blue-600 rounded-full animation-delay-200"></div>
                      <div className="w-3 h-3 bg-blue-600 rounded-full animation-delay-400"></div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {gameState.status === 'active' && gameState.game && (
          <div className="max-w-4xl mx-auto px-2 sm:px-0">
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">{gameState.game.title}</h2>
                  <p className="text-gray-600 mt-2">{gameState.game.description}</p>
                  <div className="mt-2 text-sm text-gray-500">Hafta {gameState.game.weekNo}</div>
                </div>
                <div className="text-5xl">🎮</div>
              </div>
            </div>

            {/* Oyun Komponenti */}
            {gameState.game.code === 'lost-key' && (
              <>
                {/* Admin için kontrol paneli, öğrenciler için oyun */}
                {session?.user.role === 'ADMIN' ? (
                  <LostKeyGameControl gameInstanceId={gameState.game.id} />
                ) : (
                  <LostKeyGame 
                    gameInstanceId={gameState.game.id}
                    config={gameState.game.config}
                  />
                )}
              </>
            )}

            {gameState.game.code !== 'lost-key' && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 text-center">
                <div className="text-6xl mb-4">🎮</div>
                <p className="text-blue-800 text-lg font-semibold mb-2">
                  Oyun: {gameState.game.code}
                </p>
                <p className="text-gray-600">
                  Bu oyun henüz geliştirilmedi.
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

