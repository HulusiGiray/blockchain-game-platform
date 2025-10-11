'use client'

import { useState, useEffect } from 'react'

type Player = {
  userId: string
  username: string
  address: string
  isOwner: boolean
  guessedPlayer: string | null
  guessedAt: string | null
  signResult: boolean | null
  signedAt: string | null
}

type Props = {
  gameInstanceId: string
}

export default function LostKeyGameControl({ gameInstanceId }: Props) {
  const [liveData, setLiveData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadLiveStatus()
    const interval = setInterval(loadLiveStatus, 3000) // Her 3 saniyede bir güncelle
    return () => clearInterval(interval)
  }, [gameInstanceId])

  const loadLiveStatus = async () => {
    try {
      const res = await fetch(`/api/admin/game/live-status?gameInstanceId=${gameInstanceId}`)
      const data = await res.json()
      if (res.ok) {
        setLiveData(data)
      }
    } catch (error) {
      console.error('Live status error:', error)
    }
  }

  const handleAction = async (action: string) => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/admin/game/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, gameInstanceId })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage(`✅ ${action === 'start_sign_phase' ? 'İmza turu başlatıldı!' : action === 'reveal_results' ? 'Sonuçlar açıklandı!' : 'Hacker modu aktif!'}`)
        loadLiveStatus()
      } else {
        setMessage(`❌ Hata: ${data.error}`)
      }
    } catch (error) {
      setMessage('❌ Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!liveData) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p className="mt-4 text-gray-600">Oyun verisi yükleniyor...</p>
      </div>
    )
  }

  const { gameInstance, ownerId, players, stats } = liveData
  const ownerPlayer = players.find((p: Player) => p.isOwner)

  return (
    <div className="space-y-6">
      {/* Başlık ve Durum */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">{gameInstance.title}</h2>
            <p className="text-white/90">Hafta {gameInstance.weekNo}</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-white/80">Durum</div>
            <div className="text-xl font-bold">
              {gameInstance.phase === 'GUESSING' && '❓ Tahmin Turu'}
              {gameInstance.phase === 'SIGNING' && '🔑 İmza Turu'}
              {gameInstance.phase === 'ENDED' && '✅ Bitti'}
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${
          message.startsWith('✅') 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {/* Gerçek Sahip (Gizli - Sadece Admin Görür) */}
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🔑</span>
          <h3 className="font-bold text-lg text-gray-800">GERÇEK SAHİP (GİZLİ)</h3>
        </div>
        <p className="text-2xl font-bold text-yellow-700">
          👑 {ownerPlayer?.username}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Sadece sen görüyorsun - öğrenciler bilmiyor!
        </p>
      </div>

      {/* Kontrol Butonları */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">⚡ Oyun Kontrolleri</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => handleAction('start_sign_phase')}
            disabled={loading || gameInstance.phase !== 'GUESSING'}
            className="px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-bold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔑 İmza Turunu Başlat
          </button>
          <button
            onClick={() => handleAction('reveal_results')}
            disabled={loading || gameInstance.phase === 'ENDED'}
            className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🎉 Sonuçları Açıkla
          </button>
          <button
            onClick={() => handleAction('start_hacker_mode')}
            disabled={loading || gameInstance.phase === 'GUESSING'}
            className="px-4 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg font-bold hover:from-red-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🔴 Hacker Modu
          </button>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl mb-1">👥</div>
          <div className="text-2xl font-bold text-gray-800">{stats.totalPlayers}</div>
          <div className="text-xs text-gray-600">Oyuncu</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl mb-1">❓</div>
          <div className="text-2xl font-bold text-gray-800">{stats.guessCount}/{stats.totalPlayers}</div>
          <div className="text-xs text-gray-600">Tahmin</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl mb-1">🔑</div>
          <div className="text-2xl font-bold text-gray-800">{stats.signCount}/{stats.totalPlayers}</div>
          <div className="text-xs text-gray-600">İmza</div>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-600">{stats.validSignCount}</div>
          <div className="text-xs text-gray-600">Geçerli</div>
        </div>
      </div>

      {/* Oyuncu Durumları */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-4">
          <h3 className="font-bold text-white text-lg">📊 Oyuncu Durumları (Canlı)</h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {players.map((player: Player, idx: number) => (
            <div
              key={player.userId}
              className={`p-4 ${player.isOwner ? 'bg-yellow-50 border-l-4 border-l-yellow-500' : ''}`}
            >
              <div className="flex items-start gap-4">
                {/* Sıra */}
                <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold shrink-0">
                  {idx + 1}
                </div>

                {/* Oyuncu Bilgisi */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-800">{player.username}</span>
                    {player.isOwner && (
                      <span className="px-2 py-0.5 bg-yellow-400 text-gray-900 text-xs rounded-full font-bold">
                        👑 GERÇEK SAHİP
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 font-mono">{player.address}</div>

                  {/* Tahmin Durumu */}
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tahmin:</span>{' '}
                      {player.guessedPlayer ? (
                        <span className={`font-semibold ${
                          player.guessedPlayer === ownerPlayer.username 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {player.guessedPlayer} {player.guessedPlayer === ownerPlayer.username ? '✅' : '❌'}
                        </span>
                      ) : (
                        <span className="text-gray-400">Henüz yapmadı</span>
                      )}
                    </div>

                    {/* İmza Durumu */}
                    <div>
                      <span className="text-gray-500">İmza:</span>{' '}
                      {player.signResult !== null ? (
                        <span className={`font-semibold ${
                          player.signResult ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {player.signResult ? '✅ Geçerli' : '❌ Geçersiz'}
                        </span>
                      ) : (
                        <span className="text-gray-400">Henüz atmadı</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Zaman Bilgileri */}
                <div className="text-right text-xs text-gray-500 shrink-0">
                  {player.signedAt && (
                    <div>🔑 {new Date(player.signedAt).toLocaleTimeString('tr-TR')}</div>
                  )}
                  {player.guessedAt && (
                    <div>❓ {new Date(player.guessedAt).toLocaleTimeString('tr-TR')}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

