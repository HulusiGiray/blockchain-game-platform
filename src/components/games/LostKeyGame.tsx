'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

type Player = {
  userId: string
  username: string
  email: string
  address: string
}

type GameConfig = {
  ownerPlayerId: string
  players: Player[]
  gamePhase: 'GUESSING' | 'SIGNING' | 'ENDED'
  startedAt: string
  signPhaseStartedAt?: string
  revealedAt?: string
  hackerModeActive?: boolean
}

type Props = {
  gameInstanceId: string
  config: GameConfig
  onComplete?: () => void
}

export default function LostKeyGame({ gameInstanceId, config, onComplete }: Props) {
  const { data: session } = useSession()
  const [selectedGuess, setSelectedGuess] = useState<string>('')
  const [hasGuessed, setHasGuessed] = useState(false)
  const [hasSigned, setHasSigned] = useState(false)
  const [signResult, setSignResult] = useState<{ valid: boolean; message: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [gameData, setGameData] = useState(config)
  const [hackerAttempts, setHackerAttempts] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const [ownerRevealed, setOwnerRevealed] = useState<string | null>(null)

  const currentPlayer = config.players?.find(p => p.userId === session?.user.id)
  const isAdmin = session?.user.role === 'ADMIN'

  // Config eksikse veya hatalıysa
  if (!config.players || config.players.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
        <p className="text-red-800">Oyun yapılandırması hatalı. Lütfen oyunu yeniden başlatın.</p>
      </div>
    )
  }

  // Polling için oyun durumunu güncelle
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/game/current')
        const data = await res.json()
        if (data.game?.config) {
          setGameData(data.game.config)
          
          // Sonuçlar açıklandı mı?
          if (data.game.config.gamePhase === 'ENDED' && data.game.config.revealedAt) {
            setShowResults(true)
            setOwnerRevealed(data.game.config.ownerPlayerId)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  const handleGuess = async () => {
    if (!selectedGuess) return

    setLoading(true)
    try {
      const res = await fetch('/api/game/guess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameInstanceId,
          guessedOwnerId: selectedGuess
        })
      })

      if (res.ok) {
        setHasGuessed(true)
      } else {
        const data = await res.json()
        alert(data.error || 'Tahmin gönderilemedi')
      }
    } catch (error) {
      console.error('Guess error:', error)
      alert('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/game/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameInstanceId })
      })

      const data = await res.json()

      if (res.ok) {
        setHasSigned(true)
        setSignResult({
          valid: data.valid,
          message: data.message
        })
      } else {
        alert(data.error || 'İmza gönderilemedi')
      }
    } catch (error) {
      console.error('Sign error:', error)
      alert('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  // Hacker modu animasyonu
  useEffect(() => {
    if (gameData.hackerModeActive && !showResults) {
      const interval = setInterval(() => {
        setHackerAttempts(prev => {
          const next = prev + Math.floor(Math.random() * 1000000) + 500000
          if (next >= 1000000000) {
            clearInterval(interval)
            return 1000000000
          }
          return next
        })
      }, 100)

      return () => clearInterval(interval)
    }
  }, [gameData.hackerModeActive, showResults])

  // Admin görünümü yoksa sadece oyuncu görünümü
  if (!currentPlayer && !isAdmin) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
        <p className="text-yellow-800">
          Bu oyuna katılmadınız. Lobiye katılmış öğrenciler oynayabilir.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Oyun Başlığı */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-xl p-8 text-white text-center">
        <div className="text-6xl mb-4">🔐</div>
        <h2 className="text-3xl font-bold mb-2">Kayıp Anahtar Operasyonu</h2>
        <p className="text-white/90">
          Sadece private key sahibi geçerli imza atabilir!
        </p>
      </div>

      {/* Admin ise özel panel göster */}
      {isAdmin ? (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <p className="text-red-800 font-semibold text-center">
            🎯 Admin görünümü için Admin Panel'i kullanın
          </p>
        </div>
      ) : (
        <>
          {/* Oyuncu Kendi Adresi */}
          {currentPlayer && (
            <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-blue-300">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span className="text-2xl">🔑</span>
                Senin Blockchain Adresin
              </h3>
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 font-mono text-lg text-center font-bold">
                {currentPlayer.address}
              </div>
            </div>
          )}

          {/* Diğer Oyuncular */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="text-2xl">👥</span>
              Oyuncular ({config.players.length} kişi)
            </h3>
            <div className="space-y-2">
              {config.players.map((player, idx) => (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between p-3 rounded-lg ${
                    player.userId === session?.user.id
                      ? 'bg-blue-50 border-2 border-blue-300'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">{player.username}</div>
                      <div className="text-xs text-gray-500 font-mono">{player.address}</div>
                    </div>
                  </div>
                  {player.userId === session?.user.id && (
                    <span className="px-2 py-1 bg-blue-600 text-white text-xs rounded-full font-semibold">
                      Sen
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* TAHMİN TURU */}
          {gameData.gamePhase === 'GUESSING' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">❓</span>
                Tahmin Yap: Private Key Sahibi Kim?
              </h3>
              
              {!hasGuessed ? (
                <div className="space-y-4">
                  <select
                    value={selectedGuess}
                    onChange={(e) => setSelectedGuess(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Bir oyuncu seç...</option>
                    {config.players.map(player => (
                      <option key={player.userId} value={player.userId}>
                        {player.username}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleGuess}
                    disabled={!selectedGuess || loading}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Gönderiliyor...' : '📤 Tahmini Gönder'}
                  </button>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <p className="text-green-700 font-semibold">✅ Tahminini gönderdin!</p>
                  <p className="text-sm text-green-600 mt-1">İmza turunu bekle...</p>
                </div>
              )}
            </div>
          )}

          {/* İMZA TURU */}
          {gameData.gamePhase === 'SIGNING' && (
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <span className="text-2xl">🔑</span>
                İmza Turu Başladı!
              </h3>
              
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6 mb-4 border-2 border-orange-200">
                <p className="text-gray-700 text-center mb-2">
                  💡 <strong>Kural:</strong> Sadece gerçek private key sahibi geçerli imza üretebilir!
                </p>
                <p className="text-sm text-gray-600 text-center">
                  Herkes "İmza At" butonuna basacak. Sistem otomatik kontrol edecek.
                </p>
              </div>

              {!hasSigned ? (
                <button
                  onClick={handleSign}
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-lg hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 shadow-lg"
                >
                  {loading ? 'İmza Atılıyor...' : '🔑 İMZA AT'}
                </button>
              ) : signResult ? (
                <div className={`rounded-lg p-6 text-center border-2 ${
                  signResult.valid
                    ? 'bg-green-50 border-green-300'
                    : 'bg-red-50 border-red-300'
                }`}>
                  <div className="text-4xl mb-3">
                    {signResult.valid ? '✅' : '❌'}
                  </div>
                  <p className={`font-bold text-lg mb-2 ${
                    signResult.valid ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {signResult.message}
                  </p>
                  {signResult.valid ? (
                    <p className="text-sm text-green-600">
                      Sonuçların açıklanmasını bekle!
                    </p>
                  ) : (
                    <p className="text-sm text-red-600">
                      Sadece gerçek sahip geçerli imza atabilir.
                    </p>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* SONUÇ EKRANI */}
          {showResults && ownerRevealed && (
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🎉</div>
                <h3 className="text-3xl font-bold text-gray-800 mb-2">Oyun Bitti!</h3>
              </div>

              {/* Gerçek Sahip */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 mb-6 border-2 border-yellow-300">
                <p className="text-center text-gray-700 mb-2">
                  <span className="text-2xl mr-2">🔑</span>
                  <strong>Gerçek Private Key Sahibi:</strong>
                </p>
                <p className="text-center text-2xl font-bold text-yellow-700">
                  {config.players.find(p => p.userId === ownerRevealed)?.username}
                </p>
                <p className="text-center text-sm text-gray-600 mt-2">
                  ✅ Sadece bu kişi geçerli imza üretebildi!
                </p>
              </div>

              {/* Neler Öğrendik */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border-2 border-blue-200">
                <h4 className="font-bold text-lg text-gray-800 mb-4 text-center">
                  📚 Neler Öğrendik?
                </h4>
                <div className="space-y-3 text-sm text-gray-700">
                  <div className="flex gap-3">
                    <span className="text-xl shrink-0">1️⃣</span>
                    <p>
                      <strong>Private Key = Sahiplik:</strong> Sadece private key sahibi geçerli imza atabilir. Başka kimse taklit edemez.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xl shrink-0">2️⃣</span>
                    <p>
                      <strong>Public Address Herkese Açık:</strong> Herkes blockchain adreslerini görebilir, ama sadece private key sahibi işlem yapabilir.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xl shrink-0">3️⃣</span>
                    <p>
                      <strong>Dijital İmza Güvenliği:</strong> İmza, "ben bu adresin sahibiyim" kanıtıdır. Blockchain bu sayede güvenli kalır!
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <span className="text-xl shrink-0">4️⃣</span>
                    <p>
                      <strong>Brute-Force İmkansız:</strong> 256 bit = 10⁷⁷ kombinasyon. Tüm dünya bilgisayarları 1000 yıl çalışsa bulamaz!
                    </p>
                  </div>
                </div>
              </div>

              {/* Puanlar */}
              <div className="mt-6 text-center">
                <p className="text-gray-600 mb-2">Puanlar hesap bakiyenize eklendi!</p>
                <button
                  onClick={() => {
                    if (onComplete) {
                      onComplete()
                    }
                    window.location.href = '/game'
                  }}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  🏠 Ana Sayfaya Dön
                </button>
              </div>
            </div>
          )}

          {/* HACKER MODU */}
          {gameData.hackerModeActive && !showResults && (
            <div className="bg-gradient-to-r from-red-900 to-black rounded-xl shadow-2xl p-8 text-white">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">💀</div>
                <h3 className="text-3xl font-bold mb-2">HACKER SALDIRISI!</h3>
                <p className="text-red-300">
                  Hacker private key'i brute-force ile bulmaya çalışıyor...
                </p>
              </div>

              <div className="bg-black/50 rounded-lg p-6 font-mono text-center">
                <p className="text-red-400 text-sm mb-2">Denenen kombinasyonlar:</p>
                <p className="text-4xl font-bold text-red-500 mb-4">
                  {hackerAttempts.toLocaleString('tr-TR')} ⚡
                </p>
                
                {hackerAttempts >= 1000000000 && (
                  <div className="mt-6 bg-green-900/50 border border-green-500 rounded-lg p-4">
                    <p className="text-green-400 font-bold text-xl mb-2">
                      ❌ 1 MİLYAR DENEME SONUÇ: BAŞARISIZ!
                    </p>
                    <p className="text-green-300 text-sm">
                      Private key çok güçlü! 256 bit brute-force ile kırılamaz! 🛡️
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

