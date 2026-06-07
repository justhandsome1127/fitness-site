import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

// 把陣列轉成 Prisma 接受的 JSON input;null 要用 Prisma.JsonNull
function jsonOrNull(v: unknown[] | null) {
  return v && v.length ? (v as unknown as Prisma.InputJsonValue) : Prisma.JsonNull
}

// 公開讀取:GET ?username= 回傳該使用者的日誌
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.toLowerCase()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const logs = await prisma.dailyLog.findMany({
    where: { userId: user.id },
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(logs)
}

type DietItem = { meal: string; name: string; calories: number | null; protein: number | null }
type Exercise = { name: string; sets: number; reps: string; weight: string }

const MEAL_ORDER = ['早餐', '午餐', '晚餐', '點心']
function mealRank(m: string) {
  const i = MEAL_ORDER.indexOf(m)
  return i === -1 ? 99 : i
}
// 依 早餐→午餐→晚餐→點心 排序,同餐保留原順序(穩定)
function sortDiet(items: DietItem[]): DietItem[] {
  return items
    .map((it, idx) => ({ it, idx }))
    .sort((a, b) => mealRank(a.it.meal) - mealRank(b.it.meal) || a.idx - b.idx)
    .map((x) => x.it)
}

export async function POST(request: NextRequest) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error
  const userId = auth.userId

  const body = await request.json().catch(() => null)
  if (!body || typeof body.date !== 'string') {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }
  const { date, exercises, diet, dietNote, bodyNote, photos, mode } = body

  const dateObj = new Date(date + 'T00:00:00.000Z')
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: '日期無效' }, { status: 400 })
  }

  let finalExercises: Exercise[] | null = exercises ?? null
  let finalDiet: DietItem[] | null = diet ?? null
  let finalBodyNote: string | null = bodyNote ?? null
  let finalPhotos: string[] = Array.isArray(photos) ? photos : []

  // append:把這次的內容「併進」那天既有的內容(限定本使用者),而不是取代
  if (mode === 'append') {
    const existing = await prisma.dailyLog.findUnique({
      where: { userId_date: { userId, date: dateObj } },
    })
    if (existing) {
      const exDiet = (existing.diet as DietItem[] | null) ?? []
      const exExercises = (existing.exercises as Exercise[] | null) ?? []
      finalDiet = [...exDiet, ...(diet ?? [])]
      finalExercises = [...exExercises, ...(exercises ?? [])]
      finalPhotos = [...(existing.photos ?? []), ...finalPhotos]
      finalBodyNote = [existing.bodyNote, bodyNote].filter(Boolean).join('\n') || null
    }
  }

  if (finalDiet && finalDiet.length) finalDiet = sortDiet(finalDiet)
  if (finalExercises && !finalExercises.length) finalExercises = null
  if (finalDiet && !finalDiet.length) finalDiet = null

  const log = await prisma.dailyLog.upsert({
    where: { userId_date: { userId, date: dateObj } },
    update: {
      exercises: jsonOrNull(finalExercises),
      diet: jsonOrNull(finalDiet),
      dietNote,
      bodyNote: finalBodyNote,
      photos: finalPhotos,
    },
    create: {
      userId,
      date: dateObj,
      exercises: jsonOrNull(finalExercises),
      diet: jsonOrNull(finalDiet),
      dietNote,
      bodyNote: finalBodyNote,
      photos: finalPhotos,
    },
  })

  return NextResponse.json({ ...log, date: log.date.toISOString() })
}
