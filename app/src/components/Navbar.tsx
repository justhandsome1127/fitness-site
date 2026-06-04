import Link from 'next/link'

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          YEN<span className="text-blue-500">FIT</span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            首頁
          </Link>
          <Link href="/log" className="text-gray-400 hover:text-white text-sm transition-colors">
            訓練日誌
          </Link>
          <Link
            href="/admin"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
          >
            後台
          </Link>
        </div>
      </div>
    </nav>
  )
}
