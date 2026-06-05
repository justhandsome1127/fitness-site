import { prisma } from '@/lib/prisma'
import { WeightChart, type WeightPoint } from '@/components/WeightChart'
import { InBodyChart, type InBodyPoint } from '@/components/InBodyChart'
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

function InBodyStat({
  label,
  value,
  delta,
  goodWhenDown,
  color,
}: {
  label: string
  value: string
  delta: number | null
  goodWhenDown: boolean
  color: string
}) {
  let deltaEl = null
  if (delta != null && Math.abs(delta) > 0.001) {
    const isGood = goodWhenDown ? delta < 0 : delta > 0
    const arrow = delta > 0 ? '▲' : '▼'
    deltaEl = (
      <span className={`text-xs ${isGood ? 'text-green-400' : 'text-red-400'}`}>
        {arrow} {Math.abs(delta).toFixed(1)}
      </span>
    )
  }
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <p className="text-gray-500 text-xs uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
      <p className="mt-0.5 h-4">{deltaEl ?? <span className="text-gray-700 text-xs">—</span>}</p>
    </div>
  )
}

export default async function HomePage() {
  const [weights, recentLogs, inbody] = await Promise.all([
    prisma.weightEntry.findMany({ orderBy: { dayNumber: 'asc' } }),
    prisma.dailyLog.findMany({
      orderBy: { date: 'desc' },
      take: 6,
    }),
    prisma.inBodyEntry.findMany({ orderBy: { date: 'asc' } }),
  ])

  const inbodyPoints: InBodyPoint[] = inbody.map((e) => ({
    date: format(e.date, 'M/d', { locale: zhTW }),
    bodyFat: e.bodyFat,
    muscle: e.muscle,
    visceral: e.visceral,
    note: e.note,
  }))
  const latestInbody = inbody[inbody.length - 1]
  const prevInbody = inbody[inbody.length - 2]

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

      {/* Title */}
      <section className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          yen 的訓練紀錄
        </h1>
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

      {/* InBody Chart */}
      {inbodyPoints.length > 0 && (
        <section className="mb-12">
          <h2 className="text-white font-semibold text-lg mb-4">
            InBody 量測
            <span className="ml-2 text-gray-500 text-sm font-normal">
              (共 {inbody.length} 次)
            </span>
          </h2>

          {latestInbody && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <InBodyStat
                label="體脂率"
                value={`${latestInbody.bodyFat}%`}
                delta={prevInbody ? latestInbody.bodyFat - prevInbody.bodyFat : null}
                goodWhenDown
                color="text-blue-400"
              />
              <InBodyStat
                label="骨骼肌"
                value={`${latestInbody.muscle} kg`}
                delta={prevInbody ? latestInbody.muscle - prevInbody.muscle : null}
                goodWhenDown={false}
                color="text-green-400"
              />
              <InBodyStat
                label="內臟脂肪"
                value={`${latestInbody.visceral}`}
                delta={prevInbody ? latestInbody.visceral - prevInbody.visceral : null}
                goodWhenDown
                color="text-amber-400"
              />
            </div>
          )}

          <InBodyChart data={inbodyPoints} />
        </section>
      )}

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
