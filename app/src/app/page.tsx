import { prisma } from '@/lib/prisma'
import { WeightChart, type WeightPoint } from '@/components/WeightChart'
import { InBodyChart, type InBodyPoint } from '@/components/InBodyChart'
import { LogCard } from '@/components/LogCard'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

export const dynamic = 'force-dynamic'

function SectionTitle({ children, count }: { children: React.ReactNode; count?: string }) {
  return (
    <h2 className="font-serif text-ink text-xl mb-4 flex items-baseline gap-2">
      <span className="w-5 h-px bg-terracotta translate-y-[-0.3em]" />
      {children}
      {count && <span className="text-ink-soft text-sm font-sans font-normal">{count}</span>}
    </h2>
  )
}

function StatCard({
  label,
  value,
  sub,
  accent = false,
}: {
  label: string
  value: string
  sub?: string
  accent?: boolean
}) {
  return (
    <div className="bg-paper border border-line rounded-lg p-5 shadow-[0_1px_2px_rgba(43,39,35,0.04)]">
      <p className="text-ink-soft text-sm mb-1">{label}</p>
      <p className={`font-serif text-2xl ${accent ? 'text-terracotta' : 'text-ink'}`}>{value}</p>
      {sub && <p className="text-ink-faint text-xs mt-1">{sub}</p>}
    </div>
  )
}

function InBodyStat({
  label,
  value,
  delta,
  goodWhenDown,
}: {
  label: string
  value: string
  delta: number | null
  goodWhenDown: boolean
}) {
  let deltaEl = null
  if (delta != null && Math.abs(delta) > 0.001) {
    const isGood = goodWhenDown ? delta < 0 : delta > 0
    const arrow = delta > 0 ? '↑' : '↓'
    deltaEl = (
      <span className={`text-xs ${isGood ? 'text-olive' : 'text-terracotta'}`}>
        {arrow} {Math.abs(delta).toFixed(1)}
      </span>
    )
  }
  return (
    <div className="bg-paper border border-line rounded-lg p-4 shadow-[0_1px_2px_rgba(43,39,35,0.04)]">
      <p className="text-ink-soft text-sm mb-1">{label}</p>
      <p className="font-serif text-xl text-ink">{value}</p>
      <p className="mt-1 h-4">{deltaEl ?? <span className="text-ink-faint text-xs">—</span>}</p>
    </div>
  )
}

export default async function HomePage() {
  const [weights, recentLogs, inbody, settings] = await Promise.all([
    prisma.weightEntry.findMany({ orderBy: { dayNumber: 'asc' } }),
    prisma.dailyLog.findMany({
      orderBy: { date: 'desc' },
      take: 6,
    }),
    prisma.inBodyEntry.findMany({ orderBy: { date: 'asc' } }),
    prisma.settings.findUnique({ where: { id: 1 } }),
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

  // 堅持天數 = 最新一筆的 Day − 放縱日筆數
  const breakDays = weights.filter((w) => w.type === 'break').length
  const persistDays = latest ? latest.dayNumber - breakDays : 0

  // 目前體脂:後台手動值優先,留空則帶最新 InBody
  const bodyFatValue = settings?.bodyFat ?? latestInbody?.bodyFat ?? null

  // 目標體重:與目前體重的差距
  const goalWeight = settings?.goalWeight ?? null
  const toGoal =
    goalWeight != null && latest ? (latest.weight - goalWeight).toFixed(1) : null

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">

      {/* Title */}
      <section className="mb-8">
        <h1 className="font-serif text-3xl md:text-4xl text-ink">
          yen 的訓練紀錄
        </h1>
        <p className="text-ink-soft text-sm mt-2">從 100kg 一路記到現在</p>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
        <StatCard
          label="目前體重"
          value={`${latest?.weight ?? '—'} kg`}
          sub={`Day ${latest?.dayNumber ?? '—'}`}
          accent
        />
        <StatCard
          label="目標體重"
          value={goalWeight != null ? `${goalWeight} kg` : '—'}
          sub={toGoal != null ? `還差 ${toGoal} kg` : '後台可設定'}
        />
        <StatCard
          label="堅持天數"
          value={`${persistDays} 天`}
          sub={`放縱 ${breakDays} 天`}
        />
        <StatCard
          label="目前體脂"
          value={bodyFatValue != null ? `${bodyFatValue}%` : '—'}
          sub={settings?.bodyFat != null ? '手動設定' : '最新 InBody'}
        />
      </section>

      {/* Weight Chart */}
      <section className="mb-12">
        <SectionTitle count={`${weights.length} 天紀錄`}>體重變化圖</SectionTitle>
        {weightPoints.length > 0 ? (
          <WeightChart data={weightPoints} />
        ) : (
          <div className="bg-paper border border-line rounded-lg p-10 text-center text-ink-faint">
            尚無體重數據
          </div>
        )}
      </section>

      {/* InBody Chart */}
      {inbodyPoints.length > 0 && (
        <section className="mb-12">
          <SectionTitle count={`共 ${inbody.length} 次`}>InBody 量測</SectionTitle>

          {latestInbody && (
            <div className="grid grid-cols-3 gap-3 mb-4">
              <InBodyStat
                label="體脂率"
                value={`${latestInbody.bodyFat}%`}
                delta={prevInbody ? latestInbody.bodyFat - prevInbody.bodyFat : null}
                goodWhenDown
              />
              <InBodyStat
                label="骨骼肌"
                value={`${latestInbody.muscle} kg`}
                delta={prevInbody ? latestInbody.muscle - prevInbody.muscle : null}
                goodWhenDown={false}
              />
              <InBodyStat
                label="內臟脂肪"
                value={`${latestInbody.visceral}`}
                delta={prevInbody ? latestInbody.visceral - prevInbody.visceral : null}
                goodWhenDown
              />
            </div>
          )}

          <InBodyChart data={inbodyPoints} />
        </section>
      )}

      {/* Recent Logs */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <SectionTitle>最近訓練日誌</SectionTitle>
          <a href="/log" className="text-terracotta hover:text-terracotta/80 text-sm transition-colors">
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
          <div className="bg-paper border border-line rounded-lg p-10 text-center">
            <p className="text-ink-soft">還沒有訓練日誌</p>
            <p className="text-ink-faint text-sm mt-1">登入後台開始新增吧</p>
          </div>
        )}
      </section>
    </div>
  )
}
