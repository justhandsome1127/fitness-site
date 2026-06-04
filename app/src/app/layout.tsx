import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'YenFit — 我的健身旅程',
  description: '記錄從100kg到80kg的減脂旅程，以及後續的增肌訓練',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <Navbar />
        <main className="pt-14">{children}</main>
      </body>
    </html>
  )
}
