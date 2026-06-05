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
      <div className="bg-paper border border-line hover:border-terracotta-soft rounded-lg p-4 transition-colors shadow-[0_1px_2px_rgba(43,39,35,0.04)] group">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="font-serif text-ink text-lg">{displayDate}</p>
            <p className="text-ink-faint text-xs mt-0.5">{dateStr}</p>
          </div>
          {log.photos.length > 0 && (
            <span className="text-xs text-ink-soft bg-cream border border-line px-2 py-1 rounded">
              照片 {log.photos.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-sm">
          {exerciseCount > 0 && (
            <span className="flex items-center gap-1.5 text-ink-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-terracotta inline-block" />
              {exerciseCount} 個動作
            </span>
          )}
          {(log.diet?.length || log.dietNote) && (
            <span className="flex items-center gap-1.5 text-ink-soft">
              <span className="w-1.5 h-1.5 rounded-full bg-olive inline-block" />
              飲食記錄
            </span>
          )}
        </div>

        {exerciseCount > 0 && log.exercises && (
          <div className="mt-2 flex flex-wrap gap-1">
            {log.exercises.slice(0, 4).map((ex, i) => (
              <span key={i} className="text-xs bg-cream border border-line text-ink-soft px-2 py-0.5 rounded">
                {ex.name}
              </span>
            ))}
            {exerciseCount > 4 && (
              <span className="text-xs text-ink-faint">+{exerciseCount - 4}</span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
