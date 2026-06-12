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
  const [plate, setPlate] = useState<string | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(false)

  // ログインしているか確認する
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

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPlate(null)
    setCustomer(null)
    setNotFound(false)

    const reader = new FileReader()
    reader.onloadend = () => {
      const img = new Image()
      img.onload = () => {
        // 長辺を最大1600pxに縮小する
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

        // JPEG形式・品質85%に圧縮
        const resized = canvas.toDataURL('image/jpeg', 0.85)
        setImage(resized)
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleRecognize = async () => {
    if (!image) return
    setLoading(true)
    setPlate(null)
    setCustomer(null)
    setNotFound(false)

    try {
      const res = await fetch('/api/recognize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image }),
      })
      const data = await res.json()
      const recognized = (data.result ?? '不明').trim()
      setPlate(recognized)

      if (recognized === '不明') {
        setLoading(false)
        return
      }

      const { data: customers } = await supabase
        .from('customers')
        .select('name, plate_number')
        .eq('plate_number', recognized)

      if (customers && customers.length > 0) {
        setCustomer(customers[0])
      } else {
        setNotFound(true)
      }
    } catch {
      setPlate('エラーが発生しました')
    }

    setLoading(false)
  }

  // ログイン確認中は何も表示しない
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
        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 underline"
        >
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
          <img
            src={image}
            alt="撮影したナンバー"
            className="w-full rounded-lg border border-gray-300 mb-4"
          />
          <button
            onClick={handleRecognize}
            disabled={loading}
            className="w-full bg-green-600 text-white rounded-lg py-3 font-medium disabled:opacity-50"
          >
            {loading ? '照合中...' : 'ナンバーを照合する'}
          </button>
        </div>
      )}

      {plate && (
        <div className="w-full max-w-sm mt-6 bg-white rounded-lg border border-gray-300 p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">読み取ったナンバー：</p>
          <p className="text-3xl font-bold text-gray-800 mb-4">{plate}</p>

          {customer && (
            <div className="bg-green-50 border border-green-300 rounded-lg p-4">
              <p className="text-sm text-green-700 mb-1">該当する顧客：</p>
              <p className="text-2xl font-bold text-green-800">{customer.name}</p>
            </div>
          )}

          {notFound && (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
              <p className="text-yellow-800 font-medium">該当する顧客が見つかりませんでした</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}