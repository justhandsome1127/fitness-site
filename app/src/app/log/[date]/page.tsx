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

export default async function LogDetailPage({
  params,
}: {
  params: { date: string }
}) {
  const dateObj = new Date(params.date + 'T00:00:00.000Z')
  if (isNaN(dateObj.getTime())) notFound()

  const log = await prisma.dailyLog.findFirst({
    where: {
      date: {
        gte: dateObj,
        lt: new Date(dateObj.getTime() + 86400000),
      },
    },
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
        href="/log"
        className="text-gray-500 hover:text-gray-300 text-sm mb-6 inline-flex items-center gap-1 transition-colors"
      >
        ← 返回日誌列表
      </Link>

      <h1 className="text-white text-2xl font-bold mt-2 mb-8">{displayDate}</h1>

      {/* Training */}
      {exercises && exercises.length > 0 && (
        <section className="mb-8">
          <h2 className="text-blue-400 text-xs uppercase tracking-widest font-medium mb-4">
            🏋️ 訓練內容
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 font-medium px-4 py-3">動作</th>
                  <th className="text-center text-gray-500 font-medium px-3 py-3">組數</th>
                  <th className="text-center text-gray-500 font-medium px-3 py-3">次數</th>
                  <th className="text-center text-gray-500 font-medium px-3 py-3">重量</th>
                </tr>
              </thead>
              <tbody>
                {exercises.map((ex, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/40"
                  >
                    <td className="text-white font-medium px-4 py-3">{ex.name}</td>
                    <td className="text-gray-300 text-center px-3 py-3">{ex.sets}</td>
                    <td className="text-gray-300 text-center px-3 py-3">{ex.reps}</td>
                    <td className="text-gray-300 text-center px-3 py-3">{ex.weight}</td>
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
          <h2 className="text-green-400 text-xs uppercase tracking-widest font-medium mb-4">
            🥗 飲食記錄
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left text-gray-500 font-medium px-4 py-3">品項</th>
                  <th className="text-right text-gray-500 font-medium px-3 py-3 w-24">熱量</th>
                  <th className="text-right text-gray-500 font-medium px-4 py-3 w-24">蛋白</th>
                </tr>
              </thead>
              {dietGroups.map((group) => (
                <tbody key={group.meal}>
                  <tr className="bg-gray-800/40">
                    <td
                      colSpan={3}
                      className="text-green-400 text-xs font-medium px-4 py-2 tracking-wide"
                    >
                      {group.meal}
                    </td>
                  </tr>
                  {group.items.map((it, i) => (
                    <tr
                      key={i}
                      className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/40"
                    >
                      <td className="text-white font-medium px-4 py-3">{it.name}</td>
                      <td className="text-gray-300 text-right px-3 py-3">
                        {it.calories != null ? it.calories : '—'}
                      </td>
                      <td className="text-gray-300 text-right px-4 py-3">
                        {it.protein != null ? `${it.protein}g` : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              ))}
              {(totalCalories > 0 || totalProtein > 0) && (
                <tfoot>
                  <tr className="border-t border-gray-700">
                    <td className="text-gray-400 px-4 py-3">合計</td>
                    <td className="text-green-400 font-semibold text-right px-3 py-3">
                      {totalCalories > 0 ? `${Math.round(totalCalories)}` : '—'}
                    </td>
                    <td className="text-green-400 font-semibold text-right px-4 py-3">
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
          <h2 className="text-green-400 text-xs uppercase tracking-widest font-medium mb-4">
            🥗 飲食記錄
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">{log.dietNote}</p>
          </div>
        </section>
      ) : null}

      {/* Body Note */}
      {log.bodyNote && (
        <section className="mb-8">
          <h2 className="text-yellow-400 text-xs uppercase tracking-widest font-medium mb-4">
            📝 今日記錄
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-gray-300 whitespace-pre-line leading-relaxed">{log.bodyNote}</p>
          </div>
        </section>
      )}

      {/* Photos */}
      {log.photos.length > 0 && (
        <section className="mb-8">
          <h2 className="text-purple-400 text-xs uppercase tracking-widest font-medium mb-4">
            📷 體態照片
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {log.photos.map((src, i) => (
              <a key={i} href={src} target="_blank" rel="noopener noreferrer">
                <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
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
        <div className="text-center py-16 text-gray-600">
          這天還沒有記錄內容
        </div>
      )}
    </div>
  )
}
