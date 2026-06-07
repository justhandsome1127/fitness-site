import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

// 公開讀取:GET ?username= 回傳該使用者的體重
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.toLowerCase()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const entries = await prisma.weightEntry.findMany({
    where: { userId: user.id },
    orderBy: { dayNumber: 'asc' },
  })
  return NextResponse.json(entries)
}

// Day N = 該日期 − 起始日 + 1(用 UTC 日期相減,避免時區誤差)
function dayNumberFromDate(date: Date, startDate: Date): number {
  const d = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  const s = Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate())
  return Math.round((d - s) / 86_400_000) + 1
}

const VALID_TYPES = new Set(['normal', 'break', 'bulk'])

export async function POST(request: NextRequest) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  const { date, weight, type, note } = body

  const w = Number(weight)
  if (!date || !Number.isFinite(w) || w <= 0 || w > 700) {
    return NextResponse.json({ error: '日期或體重無效' }, { status: 400 })
  }
  const entryType = VALID_TYPES.has(type) ? type : 'normal'
  const noteStr = typeof note === 'string' ? note.slice(0, 500) : null

  const user = await prisma.user.findUnique({ where: { id: auth.userId } })
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const entryDate = new Date(`${date}T00:00:00.000Z`)
  if (isNaN(entryDate.getTime())) {
    return NextResponse.json({ error: '日期無效' }, { status: 400 })
  }
  const dayNumber = dayNumberFromDate(entryDate, user.startDate)

  const entry = await prisma.weightEntry.upsert({
    where: { userId_dayNumber: { userId: auth.userId, dayNumber } },
    update: { weight: w, type: entryType, note: noteStr, date: entryDate },
    create: {
      userId: auth.userId,
      dayNumber,
      weight: w,
      type: entryType,
      note: noteStr,
      date: entryDate,
    },
  })

  return NextResponse.json(entry)
}
