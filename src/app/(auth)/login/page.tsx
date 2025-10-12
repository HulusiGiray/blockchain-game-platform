'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [studentNumber, setStudentNumber] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Öğrenci numarası kontrolü
    if (!/^[0-9]{10}$/.test(studentNumber)) {
      setError('Öğrenci numarası 10 haneli olmalıdır')
      return
    }

    setLoading(true)

    try {
      const result = await signIn('credentials', {
        studentNumber,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Öğrenci numarası veya şifre hatalı')
      } else if (result?.ok) {
        router.push('/game')
        router.refresh()
      }
    } catch (err) {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
      
      {/* Paraşüt 1 - Sol Taraf - Powered by */}
      <div 
        className="absolute left-1/2 md:left-1/4 transform -translate-x-1/2 z-50 animate-parachute-drop"
      >
        <div className="text-center scale-75 md:scale-100">
          <div className="text-4xl md:text-6xl mb-2">🪂</div>
          <div className="bg-white/90 backdrop-blur-sm px-3 py-2 md:px-6 md:py-3 rounded-full shadow-lg">
            <p className="text-gray-800 font-semibold text-[10px] md:text-sm whitespace-nowrap">
              Powered by <span className="text-blue-600">SEN0401</span> - Students
            </p>
          </div>
        </div>
      </div>

      {/* Paraşüt 2 - Sağ Taraf - Bilgilendirme */}
      <div 
        className="absolute left-1/2 md:right-1/4 transform -translate-x-1/2 md:translate-x-1/2 z-50 animate-parachute-drop-2 opacity-0"
        style={{ animationFillMode: 'forwards' }}
      >
        <div className="text-center scale-75 md:scale-100">
          <div className="text-4xl md:text-6xl mb-2">🪂</div>
          <div className="bg-white/90 backdrop-blur-sm px-3 py-2 md:px-6 md:py-3 rounded-xl shadow-lg max-w-[150px] md:max-w-xs">
            <p className="text-gray-800 font-semibold text-[9px] md:text-xs leading-relaxed">
              Sadece admin kullanıcı oluşturabilir.<br />
              Mevcut hesabınız yok ise admin ile iletişime geçin...
            </p>
          </div>
        </div>
      </div>

      {/* Animasyonlu Blockchain Zincir Ağı */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Birbirine Bağlı Zincirler - Yatay Satırlar */}
        {[...Array(6)].map((_, row) => (
          <div
            key={`row-${row}`}
            className="absolute w-full flex items-center gap-0 animate-slide-chain"
            style={{
              top: `${row * 15 + 5}%`,
              animationDirection: row % 2 === 0 ? 'normal' : 'reverse',
              animationDuration: `${8 + row * 2}s`,
            }}
          >
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="text-white opacity-15 text-4xl animate-pulse-custom"
                style={{
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                🔗
              </div>
            ))}
          </div>
        ))}

        {/* Dikey Bağlantılar */}
        {[...Array(8)].map((_, col) => (
          <div
            key={`col-${col}`}
            className="absolute flex flex-col gap-0 animate-slide-vertical"
            style={{
              left: `${col * 12 + 5}%`,
              top: '-10%',
              animationDuration: `${10 + col}s`,
            }}
          >
            {[...Array(15)].map((_, i) => (
              <div
                key={i}
                className="text-white opacity-10 text-3xl transform rotate-90 animate-pulse-custom"
                style={{
                  animationDelay: `${i * 0.15}s`,
                }}
              >
                🔗
              </div>
            ))}
          </div>
        ))}
        
        {/* Merkez Kilit - Zincirlerle Çevrili */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            {/* Dönen Zincir Halkası */}
            <div className="absolute inset-0 animate-spin" style={{ animationDuration: '20s' }}>
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-white opacity-20 text-5xl"
                  style={{
                    top: '50%',
                    left: '50%',
                    transform: `rotate(${i * 30}deg) translateY(-100px) translateX(-50%)`,
                  }}
                >
                  🔗
                </div>
              ))}
            </div>
            {/* Kilit */}
            <div className="text-white text-9xl opacity-10 animate-pulse relative z-10">🔒</div>
          </div>
        </div>
      </div>


      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 w-full max-w-md mx-4 relative z-10">
        <div className="text-center mb-6 sm:mb-8">
          <div className="text-4xl sm:text-6xl mb-3 sm:mb-4 animate-bounce">🎮</div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Blockchain Oyun Platformuna</h2>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2 sm:mb-3">Hoş Geldiniz</h3>
          <p className="text-gray-600 text-xs sm:text-sm">Var olan hesabınız ile giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Öğrenci Numarası
            </label>
            <div className="relative">
              <input
                type="text"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-32 sm:pr-48 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800 text-sm sm:text-base"
                placeholder="2500009977"
                pattern="[0-9]{10}"
                maxLength={10}
                required
              />
              <div className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs sm:text-sm pointer-events-none">
                @stu.iku.edu.tr
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">10 haneli öğrenci numaranızı girin</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-800 text-sm sm:text-base"
                placeholder="Şifrenizi girin"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                tabIndex={-1}
              >
                {showPassword ? (
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

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>

      </div>
    </div>
  )
}
