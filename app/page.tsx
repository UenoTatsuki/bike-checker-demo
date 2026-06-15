'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Customer = {
  name: string
  plate_number: string
}

export default function HomePage() {
  const router = useRouter()
  const [checking, setChecking] = useState(true)
  const [image, setImage] = useState<string | null>(null)
  const [plate, setPlate] = useState<string>('')
  const [recognized, setRecognized] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)
  const [matching, setMatching] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!data.session) {
        router.push('/login')
      } else {
        setChecking(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const resetResults = () => {
    setPlate('')
    setRecognized(false)
    setCustomers([])
    setNotFound(false)
  }

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    resetResults()

    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        const maxSize = 1600
        let { width, height } = img
        if (width > height && width > maxSize) {
          height = (height * maxSize) / width
          width = maxSize
        } else if (height > maxSize) {
          width = (width * maxSize) / height
          height = maxSize
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)
        setImage(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleRecognize = async () => {
    if (!image) return
    setLoading(true)
    resetResults()

    try {
      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data = await res.json()
      const result = (data.result ?? '不明').trim()
      setPlate(result === '不明' ? '' : result)
      setRecognized(true)
    } catch {
      setPlate('')
      setRecognized(true)
    }
    setLoading(false)
  }

  const handleMatch = async () => {
    if (!plate) return
    setMatching(true)
    setCustomers([])
    setNotFound(false)

    try {
      const { data } = await supabase
        .from('customers')
        .select('name, plate_number')
        .eq('plate_number', plate)

      if (data && data.length > 0) {
        setCustomers(data)
      } else {
        setNotFound(true)
      }
    } catch {
      setNotFound(true)
    }
    setMatching(false)
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col items-center">
      <div className="w-full max-w-sm flex justify-between items-center my-4">
        <h1 className="text-xl font-bold text-gray-800">ナンバー照合</h1>
        <button onClick={handleLogout} className="text-sm text-gray-500 underline">
          ログアウト
        </button>
      </div>

      <label className="w-full max-w-sm bg-blue-600 text-white rounded-lg py-3 text-center font-medium cursor-pointer">
        📷 ナンバーを撮影する
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
        />
      </label>

      {image && (
        <div className="w-full max-w-sm mt-6">
          <p className="text-sm text-gray-600 mb-2">撮影した画像：</p>
          <img src={image} alt="撮影したナンバー" className="w-full rounded-lg border border-gray-300 mb-4" />
          <button
            onClick={handleRecognize}
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
          >
            {loading ? '読み取り中...' : 'ナンバーを読み取る'}
          </button>
        </div>
      )}

      {recognized && (
        <div className="w-full max-w-sm mt-6 bg-white rounded-lg border border-gray-300 p-4">
          <p className="text-sm text-gray-600 mb-1">読み取り結果（間違っていれば修正できます）：</p>
          <input
            type="text"
            inputMode="numeric"
            value={plate}
            onChange={(e) => setPlate(e.target.value)}
            placeholder="数字を入力"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-2xl font-bold text-center text-gray-800 mb-4"
          />
          <button
            onClick={handleMatch}
            disabled={matching || !plate}
            className="w-full bg-blue-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
          >
            {matching ? '照合中...' : 'このナンバーで照合する'}
          </button>

          {customers.length > 0 && (
            <div className="mt-4 bg-green-50 border border-green-300 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-2 text-center">
                {customers.length === 1
                  ? '該当する顧客：'
                  : `該当する顧客が${customers.length}名います：`}
              </p>
              {customers.map((c, i) => (
                <p key={i} className="text-2xl font-bold text-green-800 text-center">
                  {c.name}
                </p>
              ))}
            </div>
          )}
          {notFound && (
            <div className="mt-4 bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-center">
              <p className="text-yellow-800 font-medium">該当する顧客が見つかりませんでした</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}