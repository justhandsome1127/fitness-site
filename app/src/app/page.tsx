import { prisma } from '@/lib/prisma'
import { WeightChart, type WeightPoint } from '@/components/WeightChart'
import { LogCard } from '@/components/LogCard'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

function StatCard({
  label,
  value,
  sub,
  color = 'text-white',
}: {
  label: string
  value: string
  sub?: string
  color?: string
}) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-0.5">{sub}</p>}
    </div>
  )
}

export default async function HomePage() {
  const [weights, recentLogs] = await Promise.all([
    prisma.weightEntry.findMany({ orderBy: { dayNumber: 'asc' } }),
    prisma.dailyLog.findMany({
      orderBy: { date: 'desc' },
      take: 6,
    }),
  ])

  const weightPoints: WeightPoint[] = weights.map((w) => ({
    day: w.dayNumber,
    weight: w.weight,
    note: w.note,
    type: w.type,
    dateStr: w.date ? format(w.date, 'M/d', { locale: zhTW }) : `Day ${w.dayNumber}`,
  }))

  const latest = weights[weights.length - 1]
  const first = weights[0]
  const minEntry = weights.reduce((a, b) => (a.weight < b.weight ? a : b))
  const lost = first ? (first.weight - (latest?.weight ?? first.weight)).toFixed(1) : '0'

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Hero */}
      <section className="mb-12 text-center">
        <p className="text-blue-500 text-sm font-medium uppercase tracking-widest mb-3">
          健身旅程紀錄
        </p>
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          100<span className="text-gray-600">kg</span>
          <span className="text-gray-600 mx-4">→</span>
          80<span className="text-blue-500">kg</span>
        </h1>
        <p className="text-gray-400 max-w-md mx-auto">
          從胖子到健身狂，每一天的訓練與飲食都有記錄。持續進行中。
        </p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="目前體重"
          value={`${latest?.weight ?? '—'} kg`}
          sub={`Day ${latest?.dayNumber ?? '—'}`}
          color="text-blue-400"
        />
        <StatCard
          label="最低體重"
          value={`${minEntry.weight} kg`}
          sub={`Day ${minEntry.dayNumber}`}
          color="text-green-400"
        />
        <StatCard
          label="此階段已減"
          value={`${lost} kg`}
          sub={`共 ${weights.length} 天`}
        />
        <StatCard
          label="訓練日誌"
          value={`${recentLogs.length > 0 ? '更新中' : '開始記錄'}`}
          sub="點選日誌查看細節"
        />
      </section>

      {/* Weight Chart */}
      <section className="mb-12">
        <h2 className="text-white font-semibold text-lg mb-4">
          體重變化圖
          <span className="ml-2 text-gray-500 text-sm font-normal">
            ({weights.length} 天紀錄)
          </span>
        </h2>
        {weightPoints.length > 0 ? (
          <WeightChart data={weightPoints} />
        ) : (
          <div className="bg-gray-900 rounded-xl p-10 text-center text-gray-600">
            尚無體重數據
          </div>
        )}
      </section>

      {/* Recent Logs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-lg">最近訓練日誌</h2>
          <a href="/log" className="text-blue-500 hover:text-blue-400 text-sm transition-colors">
            查看全部 →
          </a>
        </div>

        {recentLogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentLogs.map((log) => (
              <LogCard key={log.id} log={log as Parameters<typeof LogCard>[0]['log']} />
            ))}
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-10 text-center">
            <p className="text-gray-600">還沒有訓練日誌</p>
            <p className="text-gray-700 text-sm mt-1">登入後台開始新增吧！</p>
          </div>
        )}
      </section>
    </div>
  )
}
