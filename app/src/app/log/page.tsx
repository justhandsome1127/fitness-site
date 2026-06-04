import { prisma } from '@/lib/prisma'
import { LogCard } from '@/components/LogCard'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

export default async function LogListPage() {
  const logs = await prisma.dailyLog.findMany({
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
        <h1 className="text-white text-2xl font-bold">訓練日誌</h1>
        <p className="text-gray-500 mt-1">每天的訓練內容、飲食記錄與體態變化</p>
      </div>

      {logs.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-16 text-center">
          <p className="text-4xl mb-4">🏋️</p>
          <p className="text-gray-500">還沒有任何訓練日誌</p>
          <p className="text-gray-700 text-sm mt-1">登入後台開始新增吧！</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, monthLogs]) => (
            <div key={month}>
              <h2 className="text-gray-400 text-sm font-medium mb-3 uppercase tracking-widest">
                {month}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {monthLogs.map((log) => (
                  <LogCard key={log.id} log={log as Parameters<typeof LogCard>[0]['log']} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
