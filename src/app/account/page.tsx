'use client'

import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'

type MenuItem = 'info' | 'bonus' | 'password'

export default function AccountPage() {
  const { data: session } = useSession()
  const [activeMenu, setActiveMenu] = useState<MenuItem>('info')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)
  const [balance, setBalance] = useState<any>(null)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordChangedAt, setPasswordChangedAt] = useState<string | null>(null)
  const [showSuccessPopup, setShowSuccessPopup] = useState(false)

  useEffect(() => {
    if (session) {
      fetch('/api/user/balance')
        .then(res => res.json())
        .then(setBalance)
        .catch(console.error)
      
      fetch('/api/user/password-info')
        .then(res => res.json())
        .then(data => setPasswordChangedAt(data.passwordChangedAt))
        .catch(console.error)
    }
  }, [session])

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Yeni şifreler eşleşmiyor' })
      return
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Yeni şifre en az 6 karakter olmalıdır' })
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (res.ok) {
        // Popup göster
        setShowSuccessPopup(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        
        // Son değişiklik tarihini güncelle
        fetch('/api/user/password-info')
          .then(res => res.json())
          .then(data => setPasswordChangedAt(data.passwordChangedAt))
          .catch(console.error)
        
        // 3 saniye sonra çıkış yap
        setTimeout(() => {
          signOut({ callbackUrl: '/login' })
        }, 3000)
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <div className="flex-1 flex">
        {/* Sol Menü */}
        <aside className="w-64 bg-white shadow-lg border-r border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-gray-200">👤 Hesabım</h2>
            <nav className="space-y-1">
              <button
                onClick={() => setActiveMenu('info')}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b-2 border-gray-300 cursor-pointer ${
                  activeMenu === 'info'
                    ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-l-purple-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <span className="text-xl">ℹ️</span>
                <span>Bilgilerim</span>
              </button>

              <button
                onClick={() => setActiveMenu('bonus')}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b-2 border-gray-300 cursor-pointer ${
                  activeMenu === 'bonus'
                    ? 'bg-green-50 text-green-700 font-semibold border-l-4 border-l-green-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <span className="text-xl">💰</span>
                <span>Bonuslarım</span>
              </button>
              
              <button
                onClick={() => setActiveMenu('password')}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b-2 border-gray-300 cursor-pointer ${
                  activeMenu === 'password'
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-l-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <span className="text-xl">🔒</span>
                <span>Şifre Değiştir</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Ana İçerik */}
        <main className="flex-1 p-8 overflow-y-auto">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Bilgilerim */}
          {activeMenu === 'info' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">ℹ️ Bilgilerim</h2>

              {/* Profil Kartı */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-5xl backdrop-blur-sm">
                    {session?.user.role === 'ADMIN' ? '👑' : '👤'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-3xl font-bold mb-2">{session?.user.username}</h3>
                    <p className="text-white/90 text-lg">{session?.user.email}</p>
                    <div className="mt-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        session?.user.role === 'ADMIN'
                          ? 'bg-yellow-400 text-gray-900'
                          : 'bg-white/20 text-white'
                      }`}>
                        {session?.user.role === 'ADMIN' ? '👑 Admin' : '👤 Öğrenci'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detaylı Bilgiler */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">📧</span>
                    İletişim Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">E-posta Adresi</div>
                      <div className="font-medium text-gray-800">{session?.user.email}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Öğrenci Numarası</div>
                      <div className="font-medium text-gray-800">
                        {session?.user.email?.split('@')[0] || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <span className="text-2xl">👤</span>
                    Hesap Bilgileri
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Kullanıcı Adı</div>
                      <div className="font-medium text-gray-800">{session?.user.username}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-500 mb-1">Hesap Tipi</div>
                      <div className="font-medium text-gray-800">
                        {session?.user.role === 'ADMIN' ? '👑 Yönetici Hesabı' : '👤 Öğrenci Hesabı'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Bonuslarım */}
          {activeMenu === 'bonus' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">💰 Bonuslarım</h2>

              {/* Toplam Bonus Kartı */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl p-8 text-white mb-8">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm opacity-90 mb-2">Toplam Bonus Puanım</div>
                    <div className="text-6xl font-bold">
                      {balance ? balance.totalPoints : '...'}
                    </div>
                  </div>
                  <div className="text-8xl opacity-20">💰</div>
                </div>
              </div>

              {/* İstatistikler */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {/* Katıldığım Oyunlar */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">🎮</div>
                    <div className="text-2xl font-bold text-gray-800">
                      {balance?.gamesPlayed || 0}
                    </div>
                    <div className="text-sm text-gray-600">Katıldığım Oyun</div>
                  </div>
                  {balance?.uniqueGames && balance.uniqueGames.length > 0 ? (
                    <div className="border-t pt-3">
                      <div className="text-xs text-gray-500 mb-2">Oyun Listesi:</div>
                      <div className="space-y-1">
                        {balance.uniqueGames.map((gameName: string, idx: number) => (
                          <div key={idx} className="text-xs text-gray-700 bg-gray-50 px-2 py-1 rounded">
                            • {gameName}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center">
                      Henüz oyuna katılmadınız
                    </div>
                  )}
                </div>

                {/* Toplam Bonus */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="text-center mb-4">
                    <div className="text-3xl mb-2">💰</div>
                    <div className="text-2xl font-bold text-green-600">
                      {balance ? balance.totalPoints : 0}
                    </div>
                    <div className="text-sm text-gray-600">Toplam Bonus</div>
                  </div>
                  {balance?.bonusHistory && balance.bonusHistory.length > 0 ? (
                    <div className="border-t pt-3">
                      <div className="text-xs text-gray-500 mb-2">Bonus Kaynakları:</div>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {balance.bonusHistory.map((bonus: any, idx: number) => (
                          <div key={idx} className="text-xs bg-green-50 px-3 py-2 rounded border border-green-200">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="font-semibold text-gray-800">{bonus.source}</span>
                              <span className="font-bold text-green-600 flex-shrink-0">+{bonus.points}</span>
                            </div>
                            <div className="text-gray-600 text-xs">{bonus.reason}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-400 text-center">
                      Henüz bonus kazanmadınız
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Şifre Değiştir */}
          {activeMenu === 'password' && (
            <div className="max-w-2xl mx-auto">
              <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">🔒 Şifre Değiştir</h2>

              <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-gray-200">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-2xl">
                      🔐
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Güvenlik</h3>
                      <p className="text-sm text-gray-600">Şifrenizi düzenli olarak değiştirin</p>
                    </div>
                  </div>

                  {/* Son Şifre Değişikliği */}
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="text-xs text-gray-500 mb-1">Son Şifre Değişikliği</div>
                    {passwordChangedAt ? (
                      <div className="text-sm text-gray-700">
                        <div className="font-medium">
                          {new Date(passwordChangedAt).toLocaleDateString('tr-TR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Saat: {new Date(passwordChangedAt).toLocaleTimeString('tr-TR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-orange-600 font-medium">
                        Şifrenizi daha önce hiç değiştirmediniz
                      </div>
                    )}
                  </div>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mevcut Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                        placeholder="Mevcut şifrenizi girin"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        tabIndex={-1}
                      >
                        {showCurrentPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-gray-800"
                        placeholder="Yeni şifrenizi girin"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        tabIndex={-1}
                      >
                        {showNewPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">En az 6 karakter olmalıdır</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Yeni Şifre (Tekrar)
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 ${
                          confirmPassword && newPassword && confirmPassword !== newPassword
                            ? 'border-red-300 bg-red-50'
                            : confirmPassword && newPassword && confirmPassword === newPassword
                            ? 'border-green-300 bg-green-50'
                            : 'border-gray-300'
                        }`}
                        placeholder="Yeni şifrenizi tekrar girin"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        tabIndex={-1}
                      >
                        {showConfirmPassword ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    {/* Şifre Eşleşme Uyarısı */}
                    {confirmPassword && newPassword && confirmPassword !== newPassword && (
                      <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <span>❌</span> Şifreler eşleşmiyor
                      </p>
                    )}
                    {confirmPassword && newPassword && confirmPassword === newPassword && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <span>✅</span> Şifreler eşleşiyor
                      </p>
                    )}
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 shadow-lg"
                    >
                      {loading ? 'Değiştiriliyor...' : '✅ Şifreyi Değiştir'}
                    </button>
                  </div>
                </form>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex gap-3">
                    <div className="text-blue-600 text-xl">💡</div>
                    <div className="text-sm text-blue-800">
                      <strong>Güvenlik İpucu:</strong> Güçlü bir şifre için büyük-küçük harf, rakam ve özel karakterler kullanın.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Başarılı Şifre Değişikliği Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center animate-bounce">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Başarılı!</h3>
            <p className="text-gray-600 mb-4">
              Şifreniz başarıyla değiştirildi.
            </p>
            <p className="text-gray-700 font-semibold">
              Çıkış yapılıyor...
            </p>
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
