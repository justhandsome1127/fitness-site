import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'
import Image from 'next/image'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

type Exercise = {
  name: string
  sets: number
  reps: string
  weight: string
}

type DietItem = {
  meal: string
  name: string
  calories: number | null
  protein: number | null
}

const MEAL_ORDER = ['早餐', '午餐', '晚餐', '點心']

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-serif text-ink text-lg mb-4 flex items-baseline gap-2">
      <span className="w-5 h-px bg-terracotta translate-y-[-0.3em]" />
      {children}
    </h2>
  )
}

export default async function LogDetailPage({
  params,
}: {
  params: { username: string; date: string }
}) {
  const username = params.username.toLowerCase()
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) notFound()

  const dateObj = new Date(params.date + 'T00:00:00.000Z')
  if (isNaN(dateObj.getTime())) notFound()

  const log = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: user.id, date: dateObj } },
  })
  if (!log) notFound()

  const exercises = log.exercises as Exercise[] | null
  const diet = log.diet as DietItem[] | null
  const totalCalories = diet?.reduce((s, it) => s + (it.calories ?? 0), 0) ?? 0
  const totalProtein = diet?.reduce((s, it) => s + (it.protein ?? 0), 0) ?? 0

  // 依餐別分組(早餐/午餐/晚餐/點心,其餘歸到最後),保留原始順序
  const dietGroups = diet?.length
    ? Array.from(new Set(diet.map((it) => it.meal || '其他')))
        .sort((a, b) => {
          const ia = MEAL_ORDER.indexOf(a)
          const ib = MEAL_ORDER.indexOf(b)
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
        })
        .map((meal) => ({
          meal,
          items: diet.filter((it) => (it.meal || '其他') === meal),
        }))
    : []
  const displayDate = format(dateObj, 'yyyy年M月d日 EEEE', { locale: zhTW })

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <Link
        href={`/u/${user.username}/log`}
        className="text-ink-soft hover:text-ink text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回日誌列表
      </Link>

      <h1 className="font-serif text-ink text-2xl mt-2 mb-8">{displayDate}</h1>

      {/* Training */}
      {exercises && exercises.length > 0 && (
        <section className="mb-8">
          <SectionTitle>訓練內容</SectionTitle>
          <div className="bg-paper border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left text-ink-soft font-medium px-4 py-3">動作</th>
                  <th className="text-center text-ink-soft font-medium px-3 py-3">組數</th>
                  <th className="text-center text-ink-soft font-medium px-3 py-3">次數</th>
                  <th className="text-center text-ink-soft font-medium px-3 py-3">重量</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex, i) => (
                  <tr
                    key={i}
                    className="border-b border-line/60 last:border-0 hover:bg-cream"
                  >
                    <td className="text-ink font-medium px-4 py-3">{ex.name}</td>
                    <td className="text-ink-soft text-center px-3 py-3">{ex.sets}</td>
                    <td className="text-ink-soft text-center px-3 py-3">{ex.reps}</td>
                    <td className="text-ink-soft text-center px-3 py-3">{ex.weight}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Diet */}
      {diet && diet.length > 0 ? (
        <section className="mb-8">
          <SectionTitle>飲食記錄</SectionTitle>
          <div className="bg-paper border border-line rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line">
                  <th className="text-left text-ink-soft font-medium px-4 py-3">品項</th>
                  <th className="text-right text-ink-soft font-medium px-3 py-3 w-24">熱量</th>
                  <th className="text-right text-ink-soft font-medium px-4 py-3 w-24">蛋白</th>
                </tr>
              </thead>
              {dietGroups.map((group) => (
                <tbody key={group.meal}>
                  <tr className="bg-cream">
                    <td
                      colSpan={3}
                      className="text-ink-soft text-xs font-medium px-4 py-2 tracking-wide"
                    >
                      {group.meal}
                    </td>
                  </tr>
                  {group.items.map((it, i) => (
                    <tr
                      key={i}
                      className="border-b border-line/60 last:border-0 hover:bg-cream"
                    >
                      <td className="text-ink font-medium px-4 py-3">{it.name}</td>
                      <td className="text-ink-soft text-right px-3 py-3">
                        {it.calories != null ? it.calories : '—'}
                      </td>
                      <td className="text-ink-soft text-right px-4 py-3">
                        {it.protein != null ? `${it.protein}g` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
              {(totalCalories > 0 || totalProtein > 0) && (
                <tfoot>
                  <tr className="border-t border-line">
                    <td className="text-ink-soft px-4 py-3">合計</td>
                    <td className="text-terracotta font-serif text-right px-3 py-3">
                      {totalCalories > 0 ? `${Math.round(totalCalories)}` : '—'}
                    </td>
                    <td className="text-terracotta font-serif text-right px-4 py-3">
                      {totalProtein > 0 ? `${Math.round(totalProtein)}g` : '—'}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>
      ) : log.dietNote ? (
        <section className="mb-8">
          <SectionTitle>飲食記錄</SectionTitle>
          <div className="bg-paper border border-line rounded-lg p-4">
            <p className="text-ink whitespace-pre-line leading-relaxed">{log.dietNote}</p>
          </div>
        </section>
      ) : null}

      {/* Body Note */}
      {log.bodyNote && (
        <section className="mb-8">
          <SectionTitle>今日記錄</SectionTitle>
          <div className="bg-paper border border-line rounded-lg p-4">
            <p className="text-ink whitespace-pre-line leading-relaxed">{log.bodyNote}</p>
          </div>
        </section>
      )}

      {/* Photos */}
      {log.photos.length > 0 && (
        <section className="mb-8">
          <SectionTitle>體態照片</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {log.photos.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-paper border border-line">
                  <Image
                    src={src}
                    alt={`體態照片 ${i + 1}`}
                    fill
                    className="object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              </a>
            ))}
          </div>
        </section>
      )}

      {!exercises?.length && !diet?.length && !log.dietNote && !log.bodyNote && log.photos.length === 0 && (
        <div className="text-center py-16 text-ink-faint">這天還沒有記錄內容</div>
      )}
    </div>
  )
}
