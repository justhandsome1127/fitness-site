'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import Link from 'next/link'

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [password, setPassword] = useState('')
  const [invite, setInvite] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // 從邀請連結 ?invite=xxx 自動帶入邀請碼
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('invite')
    if (code) setInvite(code)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: username.trim().toLowerCase(),
        displayName: displayName.trim(),
        password,
        invite: invite.trim(),
      }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setError(json.error ?? '註冊失敗')
      setLoading(false)
      return
    }

    // 註冊成功後自動登入,導到後台開始記錄
    await signIn('credentials', {
      username: username.trim().toLowerCase(),
      password,
      redirect: false,
    })
    setLoading(false)
    window.location.href = '/admin'
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-serif text-ink text-2xl text-center mb-2">註冊</h1>
        <p className="text-ink-soft text-center text-sm mb-6">建立帳號,開始記錄你的健身旅程</p>

        {/* 邀請制說明 */}
        <div className="bg-cream border border-line rounded-lg px-4 py-3 mb-6 text-sm text-ink-soft leading-relaxed">
          本站採邀請制。需要邀請碼才能註冊,請聯絡：
          <br />
          📧{' '}
          <a
            href="mailto:justhandsome1127@gmail.com"
            className="text-terracotta hover:text-terracotta/80 transition-colors break-all"
          >
            justhandsome1127@gmail.com
          </a>
          <br />
          💬 私訊 Discord <span className="text-ink font-medium">justhandsome1127</span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              placeholder="邀請碼"
              value={invite}
              onChange={(e) => setInvite(e.target.value)}
              className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink placeholder-ink-faint focus:outline-none focus:border-terracotta transition-colors"
              required
            />
            <p className="text-ink-faint text-xs mt-1">點邀請連結會自動帶入</p>
          </div>
          <div>
            <input
              type="text"
              placeholder="帳號(英文小寫、數字、底線)"
              autoCapitalize="none"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink placeholder-ink-faint focus:outline-none focus:border-terracotta transition-colors"
              required
            />
            <p className="text-ink-faint text-xs mt-1">會出現在你的網址 /u/帳號,3-20 字</p>
          </div>
          <input
            type="text"
            placeholder="顯示名稱"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-paper border border-line rounded-lg px-4 py-3 text-ink placeholder-ink-faint focus:outline-none focus:border-terracotta transition-colors"
            required
          />
          <input
            type="password"
            placeholder="密碼(至少 8 碼)"
            autoComplete="new-password"
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
            {loading ? '建立中...' : '註冊'}
          </button>
        </form>

        <p className="text-ink-soft text-center text-sm mt-6">
          已經有帳號?{' '}
          <Link href="/admin" className="text-terracotta hover:text-terracotta/80 transition-colors">
            登入
          </Link>
        </p>
      </div>
    </div>
  )
}
