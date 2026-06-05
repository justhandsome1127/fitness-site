import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-cream/85 backdrop-blur-md border-b border-line">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="font-serif text-ink text-xl tracking-tight flex items-baseline gap-0.5"
        >
          yenfit
          <span className="w-1.5 h-1.5 rounded-full bg-terracotta inline-block" />
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-ink-soft hover:text-ink text-sm transition-colors">
            首頁
          </Link>
          <Link href="/log" className="text-ink-soft hover:text-ink text-sm transition-colors">
            訓練日誌
          </Link>
          <Link
            href="/admin"
            className="bg-terracotta hover:bg-terracotta/90 text-cream text-sm px-3 py-1.5 rounded-md transition-colors"
          >
            後台
          </Link>
        </div>
      </div>
    </nav>
  )
}
