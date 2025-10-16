'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/Header'

type Message = {
  id: string
  senderId: string
  receiverId: string
  message: string
  isRead: boolean
  createdAt: string
  sender: {
    id: string
    username: string
    email: string
    role: string
  }
}

export default function MessagesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Sadece adminler görebilir
    if (session && session.user.role !== 'ADMIN') {
      router.push('/')
      return
    }

    if (session) {
      loadMessages()
    }
  }, [session, router])

  const loadMessages = async () => {
    try {
      const res = await fetch('/api/messages/list')
      const data = await res.json()
      setMessages(data.messages || [])
    } catch (error) {
      console.error('Mesaj yükleme hatası:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      await fetch('/api/messages/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId })
      })
      
      // Mesajı güncelle
      setMessages(messages.map(msg => 
        msg.id === messageId ? { ...msg, isRead: true } : msg
      ))
    } catch (error) {
      console.error('Mesaj işaretleme hatası:', error)
    }
  }

  if (!session) return null

  if (session.user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">✉️ Mesajlar</h1>
            <p className="text-gray-600">Öğrencilerden gelen sorunları görüntüle</p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-gray-300 border-t-blue-600"></div>
              <p className="mt-4 text-gray-600">Yükleniyor...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">📭</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Henüz Mesaj Yok</h2>
              <p className="text-gray-600">Öğrenciler sorun bildirdiğinde burada görünecek</p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`bg-white rounded-xl shadow-lg p-6 transition-all ${
                    message.isRead ? 'opacity-75' : 'border-2 border-yellow-400'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
                        message.isRead ? 'bg-gray-200' : 'bg-yellow-100'
                      }`}>
                        {message.isRead ? '✉️' : '📬'}
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg">{message.sender.username}</h3>
                        <p className="text-sm text-gray-500">{message.sender.email}</p>
                      </div>
                    </div>
                    
                    {!message.isRead && (
                      <button
                        onClick={() => markAsRead(message.id)}
                        className="px-3 py-1 bg-green-500 text-white text-xs rounded-full hover:bg-green-600 transition font-semibold"
                      >
                        ✓ Okundu İşaretle
                      </button>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 mb-4 border-l-4 border-yellow-500">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{message.message}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>📅</span>
                    <span>{new Date(message.createdAt).toLocaleDateString('tr-TR', {
                      day: '2-digit',
                      month: 'long',
                      year: 'numeric'
                    })}</span>
                    <span>•</span>
                    <span>🕐</span>
                    <span>{new Date(message.createdAt).toLocaleTimeString('tr-TR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit'
                    })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

