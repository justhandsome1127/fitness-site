import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { LogCard } from '@/components/LogCard'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function LogListPage({ params }: { params: { username: string } }) {
  const username = params.username.toLowerCase()
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) notFound()

  const logs = await prisma.dailyLog.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  })

  const grouped: Record<string, typeof logs> = {}
  for (const log of logs) {
    const month = format(new Date(log.date), 'yyyy年M月', { locale: zhTW })
    if (!grouped[month]) grouped[month] = []
    grouped[month].push(log)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="font-serif text-ink text-2xl">{user.displayName} 的訓練日誌</h1>
        <p className="text-ink-soft mt-1">每天的訓練內容、飲食記錄與體態變化</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-paper border border-line rounded-lg p-16 text-center">
          <p className="text-ink-soft">還沒有任何訓練日誌</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, monthLogs]) => (
            <div key={month}>
              <h2 className="font-serif text-ink text-lg mb-3 flex items-baseline gap-2">
                <span className="w-5 h-px bg-terracotta translate-y-[-0.3em]" />
                {month}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {monthLogs.map((log) => (
                  <LogCard
                    key={log.id}
                    username={user.username}
                    log={log as Parameters<typeof LogCard>[0]['log']}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
