'use client'

import { useState, useEffect } from 'react'

type Admin = {
  id: string
  username: string
  email: string
}

export default function SendMessageModal({ onClose }: { onClose: () => void }) {
  const [admins, setAdmins] = useState<Admin[]>([])
  const [selectedAdmin, setSelectedAdmin] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    // Adminleri yükle
    fetch('/api/messages/admins')
      .then(res => res.json())
      .then(data => setAdmins(data.admins || []))
      .catch(err => console.error('Adminler yüklenemedi:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    if (!selectedAdmin) {
      setError('Lütfen bir admin seçin')
      return
    }

    if (!message.trim()) {
      setError('Lütfen bir mesaj yazın')
      return
    }

    if (message.split(' ').length > 100) {
      setError('Mesaj en fazla 100 kelime olabilir')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiverId: selectedAdmin,
          message: message.trim()
        })
      })

      const data = await res.json()

      if (res.ok) {
        setSuccess(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setError(data.error || 'Mesaj gönderilemedi')
      }
    } catch (err) {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const wordCount = message.trim() === '' ? 0 : message.trim().split(/\s+/).filter(w => w.length > 0).length

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        {success ? (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-green-600 mb-2">Mesaj Gönderildi!</h3>
            <p className="text-gray-600">Admin en kısa sürede size dönüş yapacaktır.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Sorun Bildir</h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Admin Seçimi */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mesajı Kime Göndereceksin?
                </label>
                <select
                  value={selectedAdmin}
                  onChange={(e) => setSelectedAdmin(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-gray-800"
                  required
                >
                  <option value="">Admin Seç</option>
                  {admins.map((admin) => (
                    <option key={admin.id} value={admin.id}>
                      {admin.username}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mesaj */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Mesajın
                  </label>
                  <span className={`text-xs ${wordCount > 100 ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                    {wordCount}/100 kelime
                  </span>
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none text-gray-800 resize-none"
                  placeholder="Sorununu detaylı bir şekilde açıkla. Örnek: Oyuna katılamıyorum, sürekli hata veriyor..."
                  rows={6}
                  required
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 100 kelime (yaklaşık 500 karakter). Açık ve net bir şekilde açıkla.
                </p>
              </div>

              {/* Hata Mesajı */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Butonlar */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={loading || wordCount > 100}
                  className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Gönderiliyor...' : 'Gönder'}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  )
}

