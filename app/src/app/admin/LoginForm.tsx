'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import Link from 'next/link'

export function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      username: username.trim().toLowerCase(),
      password,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('帳號或密碼錯誤')
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-ink text-2xl text-center mb-2">登入</h1>
        <p className="text-ink-soft text-center text-sm mb-8">登入後即可記錄你的訓練</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="帳號"
            autoCapitalize="none"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink placeholder-ink-faint focus:outline-none focus:border-terracotta transition-colors"
            required
          />
          <input
            type="password"
            placeholder="密碼"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink placeholder-ink-faint focus:outline-none focus:border-terracotta transition-colors"
            required
          />
          {error && <p className="text-terracotta text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-terracotta hover:bg-terracotta/90 disabled:opacity-50 text-cream font-medium py-3 rounded-lg transition-colors"
          >
            {loading ? '登入中...' : '登入'}
          </button>
        </form>

        <p className="text-ink-soft text-center text-sm mt-6">
          還沒有帳號?{' '}
          <Link href="/register" className="text-terracotta hover:text-terracotta/80 transition-colors">
            註冊一個
          </Link>
        </p>
      </div>
    </div>
  )
}
