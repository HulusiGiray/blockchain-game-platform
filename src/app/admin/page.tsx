'use client'

import { useSession } from 'next-auth/react'
import { useState, useEffect } from 'react'
import Header from '@/components/Header'

type GameInstance = {
  id: string
  status: string
  game: {
    code: string
    title: string
  }
  weekNo: number
  startAt: string | null
}

type Submission = {
  id: string
  userId: string
  username: string
  payload: any
  createdAt: string
  isValid: boolean
}

type MenuItem = 'users' | 'add-user' | 'trash' | 'game' | 'logs'

function GameParticipants({ gameInstanceId }: { gameInstanceId: string }) {
  const [participants, setParticipants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const res = await fetch(`/api/admin/submissions?gameInstanceId=${gameInstanceId}`)
        const data = await res.json()
        const submissions = data.submissions || []
        
        // Unique kullanıcıları al
        const uniqueUsers = new Map()
        submissions.forEach((sub: any) => {
          if (!uniqueUsers.has(sub.userId)) {
            uniqueUsers.set(sub.userId, {
              username: sub.username,
              submissionCount: 1
            })
          } else {
            uniqueUsers.get(sub.userId).submissionCount++
          }
        })
        
        setParticipants(Array.from(uniqueUsers.values()))
      } catch (error) {
        console.error('Katılımcı yükleme hatası:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadParticipants()
  }, [gameInstanceId])

  if (loading) {
    return (
      <div className="mt-2 p-3 bg-purple-50 rounded text-center">
        <span className="text-sm text-purple-700">Yükleniyor...</span>
      </div>
    )
  }

  if (participants.length === 0) {
    return (
      <div className="mt-2 p-3 bg-gray-50 rounded text-center">
        <span className="text-sm text-gray-600">Henüz kimse katılmadı</span>
      </div>
    )
  }

  return (
    <div className="mt-2 p-3 bg-purple-50 rounded border border-purple-200">
      <div className="text-xs font-semibold text-purple-900 mb-2">
        👥 Katılımcılar ({participants.length} kişi)
      </div>
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {participants.map((participant, idx) => (
          <div key={idx} className="flex items-center justify-between bg-white px-2 py-1.5 rounded text-xs">
            <span className="font-medium text-gray-800">{participant.username}</span>
            <span className="text-gray-500">{participant.submissionCount} işlem</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const { data: session } = useSession()
  const [activeMenu, setActiveMenu] = useState<MenuItem>('users')
  const [gameCode, setGameCode] = useState('bit-guess')
  const [weekNo, setWeekNo] = useState(1)
  const [bitLength, setBitLength] = useState(3)
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeGame, setActiveGame] = useState<GameInstance | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'STUDENT'
  })
  const [users, setUsers] = useState<any[]>([])
  const [deletedUsers, setDeletedUsers] = useState<any[]>([])
  const [showNewUserPassword, setShowNewUserPassword] = useState(false)
  const [showBonusModal, setShowBonusModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [bonusAmount, setBonusAmount] = useState('')
  const [bonusReason, setBonusReason] = useState('')
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [scheduledGame, setScheduledGame] = useState<any>(null)
  const [waitingUsers, setWaitingUsers] = useState<any[]>([])
  const [logs, setLogs] = useState<any[]>([])
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)

  useEffect(() => {
    if (session?.user.role === 'ADMIN') {
      loadActiveGame()
      loadUsers()
      loadDeletedUsers()
      loadScheduledGame()
      loadLogs()
    }
  }, [session])

  const loadActiveGame = async () => {
    try {
      const res = await fetch('/api/game/current')
      const data = await res.json()
      
      if (data.status === 'active' && data.game) {
        setActiveGame({
          id: data.game.id,
          status: 'ACTIVE',
          game: {
            code: data.game.code,
            title: data.game.title
          },
          weekNo: data.game.weekNo,
          startAt: new Date().toISOString()
        })
        loadSubmissions(data.game.id)
      } else {
        setActiveGame(null)
      }
    } catch (error) {
      console.error('Oyun yükleme hatası:', error)
    }
  }

  const loadSubmissions = async (gameInstanceId: string) => {
    try {
      const res = await fetch(`/api/admin/submissions?gameInstanceId=${gameInstanceId}`)
      const data = await res.json()
      setSubmissions(data.submissions || [])
    } catch (error) {
      console.error('Submissions yükleme hatası:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await fetch('/api/admin/users/list')
      const data = await res.json()
      setUsers(data.users || [])
    } catch (error) {
      console.error('Kullanıcı listesi yükleme hatası:', error)
    }
  }

  const loadDeletedUsers = async () => {
    try {
      const res = await fetch('/api/admin/users/deleted')
      const data = await res.json()
      setDeletedUsers(data.deletedUsers || [])
    } catch (error) {
      console.error('Silinen kullanıcılar yükleme hatası:', error)
    }
  }

  const loadScheduledGame = async () => {
    try {
      const res = await fetch('/api/game/waiting-room')
      const data = await res.json()
      if (data.gameInstanceId) {
        setScheduledGame(data)
        setWaitingUsers(data.waiting || [])
      } else {
        setScheduledGame(null)
        setWaitingUsers([])
      }
    } catch (error) {
      console.error('Scheduled oyun yükleme hatası:', error)
    }
  }

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs')
      const data = await res.json()
      setLogs(data.logs || [])
    } catch (error) {
      console.error('Log yükleme hatası:', error)
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    // Öğrenci için e-posta formatı kontrolü
    if (newUser.role === 'STUDENT') {
      const emailRegex = /^[0-9]{10}@stu\.iku\.edu\.tr$/
      if (!emailRegex.test(newUser.email)) {
        setMessage({ 
          type: 'error', 
          text: 'E-posta formatı geçersiz! Örnek: 2200004567@stu.iku.edu.tr' 
        })
        return
      }
    }

    setLoading(true)

    try {
      const res = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setNewUser({ username: '', email: '', password: '', role: 'STUDENT' })
        loadUsers()
        setActiveMenu('users')
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`${username} kullanıcısını silmek istediğinizden emin misiniz? Bu işlem geri alınamaz!`)) {
      return
    }

    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/admin/users/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        loadUsers()
        loadDeletedUsers()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const openBonusModal = (user: any) => {
    setSelectedUser(user)
    setBonusAmount('')
    setBonusReason('')
    setShowBonusModal(true)
    setShowConfirmation(false)
  }

  const handleBonusSubmit = () => {
    if (!bonusAmount || parseInt(bonusAmount) <= 0) {
      setMessage({ type: 'error', text: 'Lütfen geçerli bir puan girin' })
      return
    }
    setShowConfirmation(true)
  }

  const confirmAddBonus = async () => {
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/admin/users/add-bonus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser.id,
          points: parseInt(bonusAmount),
          reason: bonusReason || 'Admin tarafından manuel bonus'
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setShowBonusModal(false)
        setShowConfirmation(false)
        loadUsers()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const cancelBonus = () => {
    setShowBonusModal(false)
    setShowConfirmation(false)
    setSelectedUser(null)
    setBonusAmount('')
    setBonusReason('')
  }

  const handleCreateGame = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    setLoading(true)

    try {
      const config = {
        title: gameCode === 'bit-guess' ? `${bitLength}-Bit Tahmin Oyunu` : 'Oyun',
        description: gameCode === 'bit-guess' 
          ? `${bitLength} bitlik bir sayıyı tahmin edin! (0-${Math.pow(2, bitLength) - 1})`
          : '',
        bitLength: gameCode === 'bit-guess' ? bitLength : undefined,
        correctAnswer: gameCode === 'bit-guess' ? correctAnswer : undefined,
      }

      const res = await fetch('/api/admin/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameCode, weekNo, config }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        loadScheduledGame()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const handleStartScheduledGame = async () => {
    if (!scheduledGame) return
    
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/admin/game/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameInstanceId: scheduledGame.gameInstanceId }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: data.message })
        setScheduledGame(null)
        setWaitingUsers([])
        loadActiveGame()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const handleEndGame = async () => {
    if (!activeGame) return
    if (!confirm('Oyunu bitirmek istediğinizden emin misiniz?')) return

    setLoading(true)

    try {
      let winners: any[] = []
      
      if (activeGame.game.code === 'bit-guess' && correctAnswer) {
        submissions.forEach((sub, index) => {
          if (sub.payload.guess === correctAnswer) {
            const points = index === 0 ? 10 : index === 1 ? 7 : index === 2 ? 5 : 3
            winners.push({
              userId: sub.userId,
              points,
              reason: `${index + 1}. sırada doğru tahmin! (${sub.payload.guess})`
            })
          }
        })
      }

      const res = await fetch('/api/admin/game/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gameInstanceId: activeGame.id,
          winners 
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: `${data.message} - ${winners.length} kişiye puan verildi` })
        setActiveGame(null)
        setSubmissions([])
        setCorrectAnswer('')
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Bir hata oluştu' })
    } finally {
      setLoading(false)
    }
  }

  const refreshSubmissions = () => {
    if (activeGame) {
      loadSubmissions(activeGame.id)
    }
  }

  if (!session || session.user.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            Yetkisiz erişim!
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      {/* Mobil Menü Butonu */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-4 rounded-full shadow-lg"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      
      <div className="flex-1 flex relative">
        {/* Sol Menü */}
        <aside className={`${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:relative w-64 bg-white shadow-lg border-r border-gray-200 z-40 transition-transform duration-300 h-full overflow-y-auto`}>
          <div className="p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6 pb-4 border-b-2 border-gray-200">⚡ Admin Panel</h2>
            <nav className="space-y-1">
              <button
                onClick={() => {
                  setActiveMenu('users')
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b-2 border-gray-300 cursor-pointer ${
                  activeMenu === 'users'
                    ? 'bg-blue-50 text-blue-700 font-semibold border-l-4 border-l-blue-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <span className="text-xl">👥</span>
                <div>
                  <div>Aktif Kullanıcılar</div>
                  {users.length > 0 && (
                    <div className="text-xs opacity-75">
                      {users.filter(u => u.role === 'ADMIN').length} admin, {users.filter(u => u.role === 'STUDENT').length} öğrenci
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => {
                  setActiveMenu('add-user')
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b-2 border-gray-300 cursor-pointer ${
                  activeMenu === 'add-user'
                    ? 'bg-green-50 text-green-700 font-semibold border-l-4 border-l-green-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <span className="text-xl">➕</span>
                <span>Kullanıcı Ekle</span>
              </button>
              
              <button
                onClick={() => {
                  setActiveMenu('trash')
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b-2 border-gray-300 cursor-pointer ${
                  activeMenu === 'trash'
                    ? 'bg-red-50 text-red-700 font-semibold border-l-4 border-l-red-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <span className="text-xl">🗑️</span>
                <div>
                  <div>Çöp Kutusu</div>
                  {deletedUsers.length > 0 && (
                    <div className="text-xs opacity-75">{deletedUsers.length} kayıt</div>
                  )}
                </div>
              </button>

              <button
                onClick={() => {
                  setActiveMenu('logs')
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b-2 border-gray-300 cursor-pointer ${
                  activeMenu === 'logs'
                    ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-l-purple-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <span className="text-xl">📋</span>
                <div>
                  <div>Loglar</div>
                  {logs.length > 0 && (
                    <div className="text-xs opacity-75">{logs.length} kayıt</div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => {
                  setActiveMenu('game')
                  setMobileMenuOpen(false)
                }}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 border-b-2 border-gray-300 cursor-pointer ${
                  activeMenu === 'game'
                    ? 'bg-purple-50 text-purple-700 font-semibold border-l-4 border-l-purple-600'
                    : 'text-gray-700 hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
              >
                <span className="text-xl">🎮</span>
                <span>Oyun Yönetimi</span>
              </button>
            </nav>
          </div>
        </aside>

        {/* Mobil Overlay */}
        {mobileMenuOpen && (
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          />
        )}

        {/* Ana İçerik */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200' 
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {message.text}
            </div>
          )}

          {/* Aktif Kullanıcılar */}
          {activeMenu === 'users' && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">👥 Aktif Kullanıcılar</h2>
              
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full text-xs sm:text-sm min-w-[800px]">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-700 font-semibold">Kullanıcı</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-700 font-semibold hidden sm:table-cell">E-posta</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-gray-700 font-semibold">Rol</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 font-semibold">Bonus</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 font-semibold hidden md:table-cell">Oyunlar</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 font-semibold hidden lg:table-cell">Oluşturulma</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 font-semibold hidden lg:table-cell">Son Giriş</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 font-semibold">Bonus Ekle</th>
                      <th className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-700 font-semibold">Sil</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <div className="font-medium text-gray-800">{user.username}</div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-600 hidden sm:table-cell">{user.email}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            user.role === 'ADMIN' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {user.role === 'ADMIN' ? '👑' : '👤'}
                          </span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          <span className="font-bold text-green-600">{user.totalPoints}</span>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-gray-600 hidden md:table-cell">{user.gamesPlayed}</td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs text-blue-600 font-medium hidden lg:table-cell">
                          {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                          <div className="text-gray-500">
                            {new Date(user.createdAt).toLocaleTimeString('tr-TR', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs text-gray-500 hidden lg:table-cell">
                          {user.lastLoginAt 
                            ? new Date(user.lastLoginAt).toLocaleDateString('tr-TR')
                            : 'Hiç giriş yapmadı'
                          }
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          {user.role !== 'ADMIN' && (
                            <button
                              onClick={() => openBonusModal(user)}
                              disabled={loading}
                              className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition text-xs font-medium disabled:opacity-50"
                            >
                              ➕
                            </button>
                          )}
                        </td>
                        <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                          {user.id !== session?.user.id ? (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.username)}
                              disabled={loading}
                              className="px-2 sm:px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition text-xs font-medium disabled:opacity-50"
                            >
                              🗑️
                            </button>
                          ) : (
                            <span className="text-xs text-gray-400 italic">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Henüz kullanıcı yok
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Çöp Kutusu */}
          {activeMenu === 'trash' && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">🗑️ Çöp Kutusu</h2>
                <div className="text-sm text-gray-600">
                  Toplam {deletedUsers.length} silinen kullanıcı
                </div>
              </div>
              
              {deletedUsers.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">✨</div>
                  <p className="text-gray-500">Çöp kutusu boş</p>
                  <p className="text-sm text-gray-400 mt-2">Silinen kullanıcılar burada görünecek</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-gray-700 font-semibold">Kullanıcı Adı</th>
                        <th className="px-4 py-3 text-left text-gray-700 font-semibold">E-posta</th>
                        <th className="px-4 py-3 text-left text-gray-700 font-semibold">Rol</th>
                        <th className="px-4 py-3 text-center text-gray-700 font-semibold">Bonus</th>
                        <th className="px-4 py-3 text-center text-gray-700 font-semibold">Oyunlar</th>
                        <th className="px-4 py-3 text-center text-gray-700 font-semibold">Kayıt Tarihi</th>
                        <th className="px-4 py-3 text-center text-gray-700 font-semibold">Silinme Tarihi</th>
                        <th className="px-4 py-3 text-center text-gray-700 font-semibold">Silen Kişi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deletedUsers.map((user) => (
                        <tr key={user.id} className="border-t border-gray-200 hover:bg-red-50">
                          <td className="px-4 py-3">
                            <div className="font-medium text-gray-800">{user.username}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{user.email}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              user.role === 'ADMIN' 
                                ? 'bg-yellow-100 text-yellow-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'ADMIN' ? '👑 Admin' : '👤 Öğrenci'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="font-bold text-gray-600">{user.totalPoints}</span>
                          </td>
                          <td className="px-4 py-3 text-center text-gray-600">{user.gamesPlayed}</td>
                          <td className="px-4 py-3 text-center text-xs text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString('tr-TR')}
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-red-600 font-medium">
                            {new Date(user.deletedAt).toLocaleDateString('tr-TR')}
                            <div className="text-gray-500">
                              {new Date(user.deletedAt).toLocaleTimeString('tr-TR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-xs text-gray-600">
                            {user.deletedByUsername}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex gap-3">
                  <div className="text-yellow-600 text-2xl">⚠️</div>
                  <div>
                    <h3 className="font-semibold text-yellow-900 mb-1">Dikkat</h3>
                    <p className="text-sm text-yellow-800">
                      Çöp kutusundaki kayıtlar sadece görüntüleme amaçlıdır. 
                      Silinen kullanıcılar geri yüklenemez ve tüm ilişkili verileri kalıcı olarak silinmiştir.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loglar */}
          {activeMenu === 'logs' && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">📋 Sistem Logları</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadLogs}
                    className="px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition"
                  >
                    🔄 Yenile
                  </button>
                  <div className="text-sm text-gray-600">
                    Toplam {logs.length} log kaydı
                  </div>
                </div>
              </div>
              
              {logs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <p className="text-gray-500">Henüz log kaydı yok</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => {
                    const isExpanded = expandedLogId === log.id
                    let actionText = ''
                    let actionColor = 'blue'
                    let actionEmoji = '📝'

                    switch (log.action) {
                      case 'CREATE_USER':
                        actionText = 'Kullanıcı Oluşturdu'
                        actionColor = 'green'
                        actionEmoji = '➕'
                        break
                      case 'DELETE_USER':
                        actionText = 'Kullanıcı Sildi'
                        actionColor = 'red'
                        actionEmoji = '🗑️'
                        break
                      case 'ADD_MANUAL_BONUS':
                        actionText = 'Manuel Bonus Ekledi'
                        actionColor = 'yellow'
                        actionEmoji = '💰'
                        break
                      case 'START_GAME':
                        actionText = 'Oyun Başlattı'
                        actionColor = 'purple'
                        actionEmoji = '🎮'
                        break
                      default:
                        actionText = log.action
                        actionEmoji = '📋'
                    }

                    return (
                      <div
                        key={log.id}
                        className={`border-2 rounded-lg transition-all ${
                          actionColor === 'green'
                            ? 'border-green-200 bg-green-50'
                            : actionColor === 'red'
                            ? 'border-red-200 bg-red-50'
                            : actionColor === 'yellow'
                            ? 'border-yellow-200 bg-yellow-50'
                            : actionColor === 'purple'
                            ? 'border-purple-200 bg-purple-50'
                            : 'border-blue-200 bg-blue-50'
                        }`}
                      >
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className="text-2xl flex-shrink-0">{actionEmoji}</div>
                              <div className="flex-1 min-w-0">
                                {/* Başlık - Admin + İşlem */}
                                <div className="mb-3 pb-2 border-b border-gray-200">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <span className="font-bold text-gray-900 text-base">{log.actor.username}</span>
                                    <span className={`text-xs px-2 py-0.5 rounded ${
                                      log.actor.role === 'ADMIN' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                      {log.actor.role === 'ADMIN' ? '👑 Admin' : '👤 Öğrenci'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-sm font-semibold px-3 py-1 rounded-full ${
                                        actionColor === 'green'
                                          ? 'bg-green-200 text-green-900'
                                          : actionColor === 'red'
                                          ? 'bg-red-200 text-red-900'
                                          : actionColor === 'yellow'
                                          ? 'bg-yellow-200 text-yellow-900'
                                          : actionColor === 'purple'
                                          ? 'bg-purple-200 text-purple-900'
                                          : 'bg-blue-200 text-blue-900'
                                      }`}
                                    >
                                      {actionText}
                                    </span>
                                  </div>
                                </div>

                                {/* Detay Bilgileri */}
                                <div className="space-y-2 text-sm">
                                  {log.action === 'CREATE_USER' && log.payload && (
                                    <>
                                      <div className="bg-white/50 p-2 rounded">
                                        <span className="text-gray-600">Oluşturulan Kullanıcı:</span>
                                        <span className="ml-2 font-semibold text-gray-900">{log.payload.username}</span>
                                      </div>
                                      <div className="bg-white/50 p-2 rounded">
                                        <span className="text-gray-600">E-posta:</span>
                                        <span className="ml-2 font-semibold text-gray-900">{log.payload.email}</span>
                                      </div>
                                      <div className="bg-white/50 p-2 rounded">
                                        <span className="text-gray-600">Rol:</span>
                                        <span className="ml-2 font-semibold text-gray-900">
                                          {log.payload.role === 'ADMIN' ? '👑 Admin' : '👤 Öğrenci'}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  
                                  {log.action === 'DELETE_USER' && log.payload && (
                                    <>
                                      <div className="bg-white/50 p-2 rounded">
                                        <span className="text-gray-600">Silinen Kullanıcı:</span>
                                        <span className="ml-2 font-semibold text-gray-900">{log.payload.username}</span>
                                      </div>
                                      <div className="bg-white/50 p-2 rounded">
                                        <span className="text-gray-600">Rol:</span>
                                        <span className="ml-2 font-semibold text-gray-900">
                                          {log.payload.role === 'ADMIN' ? '👑 Admin' : '👤 Öğrenci'}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  
                                  {log.action === 'ADD_MANUAL_BONUS' && log.payload && (
                                    <>
                                      <div className="bg-white/50 p-2 rounded">
                                        <span className="text-gray-600">Bonus Alan Kullanıcı:</span>
                                        <span className="ml-2 font-semibold text-gray-900">{log.payload.username}</span>
                                      </div>
                                      <div className="bg-white/50 p-2 rounded">
                                        <span className="text-gray-600">Eklenen Puan:</span>
                                        <span className="ml-2 font-bold text-green-600 text-base">+{log.payload.points}</span>
                                      </div>
                                      {log.payload.reason && (
                                        <div className="bg-white/50 p-2 rounded">
                                          <span className="text-gray-600">Açıklama:</span>
                                          <span className="ml-2 font-semibold text-gray-900">{log.payload.reason}</span>
                                        </div>
                                      )}
                                    </>
                                  )}
                                  
                                  {log.action === 'START_GAME' && log.payload && (
                                    <>
                                      <div className="bg-white/50 p-2 rounded">
                                        <span className="text-gray-600">Oyun Kodu:</span>
                                        <span className="ml-2 font-semibold text-gray-900">{log.payload.gameCode}</span>
                                      </div>
                                      <div className="bg-white/50 p-2 rounded">
                                        <span className="text-gray-600">Hafta:</span>
                                        <span className="ml-2 font-semibold text-gray-900">{log.payload.weekNo}</span>
                                      </div>
                                      {log.targetId && (
                                        <button
                                          onClick={async () => {
                                            setExpandedLogId(expandedLogId === log.id ? null : log.id)
                                            if (expandedLogId !== log.id) {
                                              try {
                                                const res = await fetch(`/api/admin/submissions?gameInstanceId=${log.targetId}`)
                                                const data = await res.json()
                                                const submissions = data.submissions || []
                                                const usernames = [...new Set(submissions.map((s: any) => s.username))]
                                                setExpandedLogId(log.id)
                                              } catch (error) {
                                                console.error('Katılımcı yükleme hatası:', error)
                                              }
                                            }
                                          }}
                                          className="w-full mt-2 px-3 py-2 bg-purple-200 text-purple-900 rounded-lg text-sm font-semibold hover:bg-purple-300 transition flex items-center justify-center gap-2"
                                        >
                                          👁️ {isExpanded ? 'Katılımcıları Gizle' : 'Katılımcıları Göster'}
                                        </button>
                                      )}
                                      {isExpanded && log.targetId && (
                                        <GameParticipants gameInstanceId={log.targetId} />
                                      )}
                                    </>
                                  )}
                                </div>

                                {/* Tarih ve Saat */}
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <div className="flex items-center gap-2 text-xs text-gray-600">
                                    <span>📅</span>
                                    <span className="font-medium">{new Date(log.createdAt).toLocaleDateString('tr-TR', { 
                                      day: '2-digit', 
                                      month: 'long', 
                                      year: 'numeric' 
                                    })}</span>
                                    <span className="text-gray-400">•</span>
                                    <span>🕐</span>
                                    <span className="font-medium">{new Date(log.createdAt).toLocaleTimeString('tr-TR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      second: '2-digit'
                                    })}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Genişlet/Daralt Butonu */}
                            {log.action === 'START_GAME' && log.targetId && (
                              <button
                                onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                                className="text-gray-500 hover:text-gray-700 flex-shrink-0"
                              >
                                {isExpanded ? '▲' : '▼'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* Kullanıcı Ekle */}
          {activeMenu === 'add-user' && (
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 max-w-3xl mx-auto">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">➕ Yeni Kullanıcı Ekle</h2>
              
              <form onSubmit={handleCreateUser}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kullanıcı Adı
                    </label>
                    <input
                      type="text"
                      value={newUser.username}
                      onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                      placeholder="kullaniciadi"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {newUser.role === 'ADMIN' ? 'E-posta (Opsiyonel)' : 'Öğrenci Numarası'}
                    </label>
                    {newUser.role === 'ADMIN' ? (
                      <input
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                        placeholder="ornek@email.com (opsiyonel)"
                      />
                    ) : (
                      <div className="relative">
                        <input
                          type="text"
                          value={newUser.email.replace('@stu.iku.edu.tr', '')}
                          onChange={(e) => {
                            const number = e.target.value.replace(/\D/g, '').slice(0, 10)
                            setNewUser({ ...newUser, email: number ? `${number}@stu.iku.edu.tr` : '' })
                          }}
                          className="w-full px-4 py-2 pr-48 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                          placeholder="2200004567"
                          pattern="[0-9]{10}"
                          maxLength={10}
                          required
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                          @stu.iku.edu.tr
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      {newUser.role === 'ADMIN' 
                        ? 'Admin için e-posta zorunlu değildir' 
                        : '10 haneli öğrenci numarası'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Şifre
                    </label>
                    <div className="relative">
                      <input
                        type={showNewUserPassword ? "text" : "password"}
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        className="w-full px-4 py-2 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                        placeholder="En az 6 karakter"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
                        tabIndex={-1}
                      >
                        {showNewUserPassword ? (
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
                      Rol
                    </label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                    >
                      <option value="STUDENT">👤 Öğrenci</option>
                      <option value="ADMIN">👑 Admin</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-6 w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50"
                >
                  {loading ? 'Oluşturuluyor...' : '✅ Kullanıcıyı Oluştur'}
                </button>
              </form>

              <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex gap-3">
                  <div className="text-blue-600 text-2xl">💡</div>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-2">Bilgi</h3>
                    <p className="text-sm text-blue-800">
                      Kullanıcıları silmek için <strong>"Aktif Kullanıcılar"</strong> sekmesine gidin. 
                      Her kullanıcının yanındaki 🗑️ Sil butonunu kullanabilirsiniz.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Oyun Yönetimi */}
          {activeMenu === 'game' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Oyun Başlatma */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-800 mb-6">🚀 Yeni Oyun Oluştur</h2>

                  {activeGame ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-green-700 font-semibold mb-2">
                        <span className="text-2xl">🎮</span>
                        Aktif Oyun Var!
                      </div>
                      <p className="text-sm text-green-600 mb-2">
                        {activeGame.game.title} - Hafta {activeGame.weekNo}
                      </p>
                      <p className="text-xs text-green-600">
                        Yeni oyun oluşturmak için önce mevcut oyunu bitirin.
                      </p>
                    </div>
                  ) : scheduledGame ? (
                    <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-2">
                        <span className="text-2xl">⏳</span>
                        Oyun Oluşturuldu!
                      </div>
                      <p className="text-sm text-yellow-700 mb-2">
                        {scheduledGame.gameTitle} - Hafta {scheduledGame.weekNo}
                      </p>
                      <p className="text-xs text-yellow-700">
                        Sağ taraftan lobideki kullanıcıları görebilir ve oyunu başlatabilirsiniz.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleCreateGame} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Oyun Türü
                        </label>
                        <select
                          value={gameCode}
                          onChange={(e) => setGameCode(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                        >
                          <option value="lost-key">🔐 Kayıp Anahtar Operasyonu</option>
                          <option value="bit-guess">Bit Tahmin Oyunu</option>
                          <option value="peer-to-peer">Peer to Peer Oyunu</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Hafta Numarası
                        </label>
                        <input
                          type="number"
                          value={weekNo}
                          onChange={(e) => setWeekNo(parseInt(e.target.value))}
                          min="1"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                          required
                        />
                      </div>

                      {gameCode === 'bit-guess' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Bit Uzunluğu
                            </label>
                            <select
                              value={bitLength}
                              onChange={(e) => setBitLength(parseInt(e.target.value))}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                            >
                              <option value="3">3 Bit (0-7)</option>
                              <option value="4">4 Bit (0-15)</option>
                              <option value="5">5 Bit (0-31)</option>
                              <option value="6">6 Bit (0-63)</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Doğru Cevap (Gizli)
                            </label>
                            <input
                              type="text"
                              value={correctAnswer}
                              onChange={(e) => setCorrectAnswer(e.target.value)}
                              placeholder={`0-${Math.pow(2, bitLength) - 1} arası`}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                              required
                            />
                          </div>
                        </>
                      )}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition disabled:opacity-50"
                      >
                        {loading ? 'Oluşturuluyor...' : '📝 Oyunu Oluştur (Lobby Aç)'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Lobby / Aktif Oyun Kontrolü */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  {scheduledGame && !activeGame ? (
                    <>
                      <h2 className="text-xl font-bold text-gray-800 mb-6">👥 Lobby - Bekleyenler</h2>
                      
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-blue-900 mb-2">{scheduledGame.gameTitle}</h3>
                        <p className="text-sm text-blue-700">Hafta: {scheduledGame.weekNo}</p>
                        <p className="text-sm text-blue-700">Lobide: {waitingUsers.length} kişi</p>
                      </div>

                      {waitingUsers.length > 0 ? (
                        <div className="space-y-2 mb-4 max-h-96 overflow-y-auto">
                          {waitingUsers.map((user, idx) => (
                            <div key={user.userId} className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
                                  {idx + 1}
                                </div>
                                <div>
                                  <div className="font-medium text-gray-800">{user.username}</div>
                                  <div className="text-xs text-gray-500">
                                    {user.studentNumber} • {new Date(user.joinedAt).toLocaleTimeString('tr-TR')}
                                  </div>
                                </div>
                              </div>
                              <span className="px-2 py-1 bg-green-600 text-white text-xs rounded-full font-semibold">
                                ✓ Hazır
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <div className="text-4xl mb-2">😴</div>
                          <p className="text-sm">Henüz kimse lobiye katılmadı</p>
                        </div>
                      )}

                      <button
                        onClick={handleStartScheduledGame}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50 text-lg"
                      >
                        {loading ? 'Başlatılıyor...' : '🚀 Oyunu Şimdi Başlat'}
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-800">🎮 Aktif Oyun</h2>
                        {activeGame && (
                          <button
                            onClick={refreshSubmissions}
                            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition"
                          >
                            🔄 Yenile
                          </button>
                        )}
                      </div>

                      {activeGame ? (
                    <div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                        <h3 className="font-semibold text-blue-900 mb-2">{activeGame.game.title}</h3>
                        <p className="text-sm text-blue-700">Hafta: {activeGame.weekNo}</p>
                        <p className="text-sm text-blue-700">Katılımcı: {submissions.length} kişi</p>
                      </div>

                      {/* Kayıp Anahtar Oyunu için özel kontrol paneli */}
                      {activeGame.game.code === 'lost-key' && (
                        <div className="bg-purple-50 border border-purple-300 rounded-lg p-4 mb-4">
                          <p className="text-purple-700 font-semibold mb-2 text-center">
                            🔐 Detaylı kontrol için "/game" sayfasını kullanın
                          </p>
                          <a
                            href="/game"
                            className="block w-full text-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                          >
                            🎮 Oyun Kontrol Paneline Git
                          </a>
                        </div>
                      )}

                      {activeGame.game.code === 'bit-guess' && correctAnswer && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                          <p className="text-xs text-yellow-700 font-semibold mb-1">🔒 Doğru Cevap (Gizli)</p>
                          <p className="text-2xl font-bold text-yellow-900">{correctAnswer}</p>
                        </div>
                      )}

                      <div className="mb-4">
                        <h3 className="font-semibold text-gray-800 mb-3">Katılımcılar</h3>
                        {submissions.length > 0 ? (
                          <div className="space-y-2 max-h-64 overflow-y-auto">
                            {submissions.map((sub, idx) => (
                              <div key={sub.id} className={`flex items-center justify-between p-3 rounded-lg ${
                                activeGame.game.code === 'bit-guess' && sub.payload.guess === correctAnswer
                                  ? 'bg-green-100 border border-green-300'
                                  : 'bg-gray-50'
                              }`}>
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {idx + 1}. {sub.username}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {new Date(sub.createdAt).toLocaleTimeString('tr-TR')}
                                  </div>
                                </div>
                                <div className="text-right">
                                  {activeGame.game.code === 'bit-guess' && (
                                    <div className={`font-bold ${
                                      sub.payload.guess === correctAnswer
                                        ? 'text-green-700'
                                        : 'text-gray-600'
                                    }`}>
                                      Tahmin: {sub.payload.guess}
                                      {sub.payload.guess === correctAnswer && ' ✓'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-500 text-sm">Henüz kimse katılmadı</p>
                        )}
                      </div>

                      <button
                        onClick={handleEndGame}
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-red-600 to-rose-600 text-white py-3 rounded-lg font-semibold hover:from-red-700 hover:to-rose-700 transition disabled:opacity-50"
                      >
                        {loading ? 'Bitiriliyor...' : '🏁 Oyunu Bitir ve Puanları Dağıt'}
                      </button>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <div className="text-4xl mb-4">😴</div>
                          <p>Şu anda aktif oyun yok</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Bonus Ekleme Modal */}
      {showBonusModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
            {!showConfirmation ? (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  💰 Bonus Puan Ekle
                </h3>
                
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-sm text-blue-700 mb-1">Kullanıcı</div>
                  <div className="font-bold text-blue-900">{selectedUser.username}</div>
                  <div className="text-xs text-blue-600 mt-1">
                    {selectedUser.email?.split('@')[0]} - {selectedUser.email}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Eklenecek Puan
                    </label>
                    <input
                      type="number"
                      value={bonusAmount}
                      onChange={(e) => setBonusAmount(e.target.value)}
                      min="1"
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none text-gray-800 text-center text-2xl font-bold"
                      placeholder="0"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sebep (Opsiyonel)
                    </label>
                    <input
                      type="text"
                      value={bonusReason}
                      onChange={(e) => setBonusReason(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-800"
                      placeholder="Örn: Derste aktif katılım"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={cancelBonus}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleBonusSubmit}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition"
                  >
                    Devam →
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                  ⚠️ Onay Gerekli
                </h3>
                
                <div className="mb-6 p-6 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                  <div className="text-center mb-4">
                    <div className="text-sm text-gray-600 mb-2">Kullanıcı</div>
                    <div className="font-bold text-lg text-gray-800">{selectedUser.username}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      {selectedUser.email?.split('@')[0]} numaralı
                    </div>
                  </div>
                  <div className="text-center pt-4 border-t border-yellow-200">
                    <div className="text-sm text-gray-600 mb-1">Eklenecek Bonus</div>
                    <div className="text-4xl font-bold text-green-600">{bonusAmount}</div>
                    <div className="text-sm text-gray-600 mt-1">puan</div>
                  </div>
                  {bonusReason && (
                    <div className="text-center pt-4 border-t border-yellow-200 mt-4">
                      <div className="text-xs text-gray-500 mb-1">Sebep</div>
                      <div className="text-sm text-gray-700">{bonusReason}</div>
                    </div>
                  )}
                </div>

                <p className="text-center text-gray-700 font-medium mb-6">
                  Bu kullanıcıya <span className="text-green-600 font-bold">{bonusAmount} bonus</span> eklemek istediğinize emin misiniz?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={cancelBonus}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50"
                  >
                    ❌ Hayır
                  </button>
                  <button
                    onClick={confirmAddBonus}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Ekleniyor...' : '✅ Evet, Ekle'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
