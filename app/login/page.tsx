'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-6">
        <h1 className="text-xl font-bold text-center mb-6 text-gray-800">
          ログイン
        </h1>

        <label className="block text-sm text-gray-600 mb-1">メールアドレス</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-gray-800"
          placeholder="you@example.com"
        />

        <label className="block text-sm text-gray-600 mb-1">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 mb-4 text-gray-800"
          placeholder="パスワード"
        />

        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded-lg py-2 font-medium disabled:opacity-50"
        >
          {loading ? 'ログイン中...' : 'ログイン'}
        </button>

        <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm">
          <p className="font-medium text-blue-800 mb-1">デモ用アカウント</p>
          <p className="text-blue-700">Email: bike-demo@example.com</p>
          <p className="text-blue-700">Password: bikedemo2929</p>
        </div>
      </div>
    </div>
  )
}