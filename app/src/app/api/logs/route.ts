import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// 把陣列轉成 Prisma 接受的 JSON input;null 要用 Prisma.JsonNull
function jsonOrNull(v: unknown[] | null) {
  return v && v.length ? (v as unknown as Prisma.InputJsonValue) : Prisma.JsonNull
}

export async function GET() {
  const logs = await prisma.dailyLog.findMany({
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
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { date, exercises, diet, dietNote, bodyNote, photos, mode } = body

  const dateObj = new Date(date + 'T00:00:00.000Z')

  let finalExercises: Exercise[] | null = exercises ?? null
  let finalDiet: DietItem[] | null = diet ?? null
  let finalBodyNote: string | null = bodyNote ?? null
  let finalPhotos: string[] = photos ?? []

  // append:把這次的內容「併進」那天既有的內容,而不是取代
  if (mode === 'append') {
    const existing = await prisma.dailyLog.findFirst({ where: { date: dateObj } })
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
    where: { date: dateObj },
    update: {
      exercises: jsonOrNull(finalExercises),
      diet: jsonOrNull(finalDiet),
      dietNote,
      bodyNote: finalBodyNote,
      photos: finalPhotos,
    },
    create: {
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
