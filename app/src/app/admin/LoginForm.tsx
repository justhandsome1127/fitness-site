'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'

export function LoginForm() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await signIn('credentials', {
      password,
      redirect: false,
    })
    setLoading(false)
    if (res?.error) {
      setError('密碼錯誤')
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-ink text-2xl text-center mb-2">後台登入</h1>
        <p className="text-ink-soft text-center text-sm mb-8">只有你可以進入這裡</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="輸入管理員密碼"
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
      </div>
    </div>
  )
}
