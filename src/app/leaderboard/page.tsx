'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'

type LeaderboardUser = {
  id: string
  username: string
  totalPoints: number
  gamesPlayed: number
  scoresCount: number
}

export default function LeaderboardPage() {
  const { data: session } = useSession()
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string>('')

  useEffect(() => {
    if (session) {
      loadLeaderboard()
    }
  }, [session])

  const loadLeaderboard = async () => {
    try {
      const res = await fetch('/api/leaderboard')
      const data = await res.json()
      setLeaderboard(data.leaderboard || [])
      setCurrentUserId(data.currentUserId || '')
    } catch (error) {
      console.error('Liderlik tablosu yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇'
      case 2: return '🥈'
      case 3: return '🥉'
      default: return `${rank}.`
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'from-yellow-400 to-yellow-600'
      case 2: return 'from-gray-300 to-gray-500'
      case 3: return 'from-orange-400 to-orange-600'
      default: return 'from-blue-400 to-blue-600'
    }
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Başlık */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2 sm:mb-3">🏆 Liderlik Tablosu</h1>
            <p className="text-gray-600 text-xs sm:text-sm md:text-base px-4">
              Bu sıralama, oyunlardan kazanılan puanlar ve ders katılımı gibi ek bonusları içermektedir...
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">Yükleniyor...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Henüz Sıralama Yok</h2>
              <p className="text-gray-600">Oyunlara katılarak puan kazanın ve liderlik tablosunda yerinizi alın!</p>
            </div>
          ) : (
            <>
              {/* Top 3 - Podium - En az 3 kişi varsa göster */}
              {leaderboard.length >= 3 ? (
                <div className="flex items-end justify-center gap-2 sm:gap-4 mb-8 sm:mb-12 px-2">
                  {/* 2. Sıra */}
                  <div className="flex flex-col items-center flex-1 max-w-[140px] sm:max-w-[180px]">
                    <div className="bg-gradient-to-br from-gray-300 to-gray-500 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 w-full text-center mb-2 sm:mb-4">
                      <div className="text-3xl sm:text-5xl mb-2 sm:mb-3">🥈</div>
                      <div className="text-white font-bold text-sm sm:text-xl mb-1 truncate">{leaderboard[1].username}</div>
                      <div className="text-white text-xl sm:text-3xl font-bold">{leaderboard[1].totalPoints}</div>
                      <div className="text-white/80 text-xs sm:text-sm">puan</div>
                    </div>
                    <div className="bg-gray-400 w-full h-16 sm:h-24 rounded-t-lg flex items-center justify-center">
                      <span className="text-white font-bold text-2xl sm:text-4xl">2</span>
                    </div>
                  </div>

                  {/* 1. Sıra */}
                  <div className="flex flex-col items-center -mt-4 sm:-mt-8 flex-1 max-w-[160px] sm:max-w-[200px]">
                    <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-8 w-full text-center mb-2 sm:mb-4 relative">
                      <div className="absolute -top-4 sm:-top-6 left-1/2 transform -translate-x-1/2">
                        <div className="bg-yellow-500 rounded-full w-8 h-8 sm:w-12 sm:h-12 flex items-center justify-center shadow-lg">
                          <span className="text-lg sm:text-2xl">👑</span>
                        </div>
                      </div>
                      <div className="text-4xl sm:text-6xl mb-2 sm:mb-3 mt-2 sm:mt-4">🥇</div>
                      <div className="text-white font-bold text-base sm:text-2xl mb-1 sm:mb-2 truncate">{leaderboard[0].username}</div>
                      <div className="text-white text-2xl sm:text-4xl font-bold">{leaderboard[0].totalPoints}</div>
                      <div className="text-white/90 text-xs sm:text-sm">puan</div>
                    </div>
                    <div className="bg-yellow-500 w-full h-20 sm:h-32 rounded-t-lg flex items-center justify-center">
                      <span className="text-white font-bold text-3xl sm:text-5xl">1</span>
                    </div>
                  </div>

                  {/* 3. Sıra */}
                  <div className="flex flex-col items-center flex-1 max-w-[140px] sm:max-w-[180px]">
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl sm:rounded-2xl shadow-xl p-3 sm:p-6 w-full text-center mb-2 sm:mb-4">
                      <div className="text-3xl sm:text-5xl mb-2 sm:mb-3">🥉</div>
                      <div className="text-white font-bold text-sm sm:text-xl mb-1 truncate">{leaderboard[2].username}</div>
                      <div className="text-white text-xl sm:text-3xl font-bold">{leaderboard[2].totalPoints}</div>
                      <div className="text-white/80 text-xs sm:text-sm">puan</div>
                    </div>
                    <div className="bg-orange-500 w-full h-12 sm:h-16 rounded-t-lg flex items-center justify-center">
                      <span className="text-white font-bold text-2xl sm:text-4xl">3</span>
                    </div>
                  </div>
                </div>
              ) : leaderboard.length > 0 && (
                /* 3 kişiden az varsa basit liste */
                <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-2xl p-8 mb-8 text-center">
                  <div className="text-4xl mb-4">🎮</div>
                  <p className="text-gray-700 font-semibold">
                    Henüz yeterli katılımcı yok. En az 3 kişi olunca podyum görünecek!
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    Şu anda {leaderboard.length} kişi var
                  </p>
                </div>
              )}

              {/* 4. Sıra ve Sonrası */}
              {leaderboard.length > 3 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 sm:p-6">
                    <h2 className="text-lg sm:text-2xl font-bold text-white text-center">📊 4. ve Sonrası</h2>
                  </div>
                  
                  <div className="divide-y divide-gray-200">
                    {leaderboard.slice(3).map((user, index) => {
                      const isCurrentUser = user.id === currentUserId
                      const rank = index + 4
                    
                    return (
                      <div 
                        key={user.id} 
                        className={`flex items-center justify-between p-3 sm:p-6 transition-colors ${
                          isCurrentUser 
                            ? 'bg-blue-50 border-l-4 border-blue-600' 
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 sm:gap-6 flex-1">
                          {/* Sıra */}
                          <div className="w-10 sm:w-16 text-center flex-shrink-0">
                            {rank <= 3 ? (
                              <div className={`bg-gradient-to-br ${getRankColor(rank)} w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg`}>
                                {getMedalEmoji(rank)}
                              </div>
                            ) : (
                              <div className="text-xl sm:text-3xl font-bold text-gray-400">
                                {rank}
                              </div>
                            )}
                          </div>

                          {/* Kullanıcı Bilgisi */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <div className="font-bold text-sm sm:text-xl text-gray-800 truncate">
                                {user.username}
                              </div>
                              {isCurrentUser && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-semibold flex-shrink-0">
                                  Siz
                                </span>
                              )}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">
                              🎮 {user.gamesPlayed} oyun
                            </div>
                          </div>

                          {/* Puan */}
                          <div className="text-right flex-shrink-0">
                            <div className="text-xl sm:text-3xl font-bold text-green-600">
                              {user.totalPoints}
                            </div>
                            <div className="text-xs sm:text-sm text-gray-500">puan</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                </div>
              )}


              {/* İstatistikler */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-6 sm:mt-8">
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl mb-2">👥</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">{leaderboard.length}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Sisteme kayıtlı öğrenci sayısı</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl mb-2">🎯</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">
                    {Math.max(...leaderboard.map(u => u.totalPoints))}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">En Yüksek Puan</div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 text-center">
                  <div className="text-2xl sm:text-3xl mb-2">📈</div>
                  <div className="text-xl sm:text-2xl font-bold text-gray-800">
                    {Math.round(
                      leaderboard.reduce((sum, u) => sum + u.totalPoints, 0) / leaderboard.length
                    )}
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600">Ortalama Puan</div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

