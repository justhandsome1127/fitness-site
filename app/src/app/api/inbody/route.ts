import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

// 公開讀取:GET ?username= 回傳該使用者的 InBody
export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username')?.toLowerCase()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const entries = await prisma.inBodyEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(entries)
}

export async function POST(request: NextRequest) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error
  const userId = auth.userId

  const body = await request.json().catch(() => null)
  if (!body || typeof body.date !== 'string') {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }
  const { date, weight, bodyFat, muscle, visceral, note } = body

  const bf = Number(bodyFat)
  const mu = Number(muscle)
  const vi = Number(visceral)
  if (![bf, mu, vi].every(Number.isFinite)) {
    return NextResponse.json({ error: '體脂/骨骼肌/內臟脂肪需為數字' }, { status: 400 })
  }
  const we = weight != null && weight !== '' ? Number(weight) : null
  if (we != null && !Number.isFinite(we)) {
    return NextResponse.json({ error: '體重無效' }, { status: 400 })
  }
  const dateObj = new Date(date)
  if (isNaN(dateObj.getTime())) {
    return NextResponse.json({ error: '日期無效' }, { status: 400 })
  }
  const noteStr = typeof note === 'string' ? note.slice(0, 500) : null

  const entry = await prisma.inBodyEntry.upsert({
    where: { userId_date: { userId, date: dateObj } },
    update: { weight: we, bodyFat: bf, muscle: mu, visceral: vi, note: noteStr },
    create: { userId, date: dateObj, weight: we, bodyFat: bf, muscle: mu, visceral: vi, note: noteStr },
  })

  return NextResponse.json(entry)
}
