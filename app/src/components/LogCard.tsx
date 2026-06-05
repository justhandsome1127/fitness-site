import Link from 'next/link'
import { format } from 'date-fns'
import { zhTW } from 'date-fns/locale'

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

type Log = {
  id: number
  date: Date | string
  exercises: Exercise[] | null
  diet: DietItem[] | null
  dietNote: string | null
  bodyNote: string | null
  photos: string[]
}

export function LogCard({ log }: { log: Log }) {
  const date = new Date(log.date)
  const dateStr = format(date, 'yyyy-MM-dd')
  const displayDate = format(date, 'M月d日 EEEE', { locale: zhTW })
  const exerciseCount = log.exercises?.length ?? 0

  return (
    <Link href={`/log/${dateStr}`}>
      <div className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl p-4 transition-all hover:bg-gray-800/80 group">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-white font-semibold">{displayDate}</p>
            <p className="text-gray-500 text-xs mt-0.5">{dateStr}</p>
          </div>
          {log.photos.length > 0 && (
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded-md">
              📷 {log.photos.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {exerciseCount > 0 && (
            <span className="flex items-center gap-1 text-blue-400">
              <span>🏋️</span>
              <span>{exerciseCount} 個動作</span>
            </span>
          )}
          {(log.diet?.length || log.dietNote) && (
            <span className="flex items-center gap-1 text-green-400">
              <span>🥗</span>
              <span>飲食記錄</span>
            </span>
          )}
        </div>

        {exerciseCount > 0 && log.exercises && (
          <div className="mt-2 flex flex-wrap gap-1">
            {log.exercises.slice(0, 4).map((ex, i) => (
              <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded">
                {ex.name}
              </span>
            ))}
            {exerciseCount > 4 && (
              <span className="text-xs text-gray-600">+{exerciseCount - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
