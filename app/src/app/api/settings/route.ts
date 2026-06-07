import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

// 回傳目前登入者自己的設定(起始日/目標/體脂)
export async function GET() {
  const auth = await requireUserId()
  if ('error' in auth) return auth.error
  const user = await prisma.user.findUnique({ where: { id: auth.userId } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({
    startDate: user.startDate,
    goalWeight: user.goalWeight,
    bodyFat: user.bodyFat,
  })
}

export async function POST(request: NextRequest) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error

  const body = await request.json().catch(() => null)
  if (!body || typeof body.startDate !== 'string') {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }
  const { startDate, goalWeight, bodyFat } = body

  const startObj = new Date(`${startDate}T00:00:00.000Z`)
  if (isNaN(startObj.getTime())) {
    return NextResponse.json({ error: '起始日無效' }, { status: 400 })
  }
  const goal =
    goalWeight != null && goalWeight !== '' ? parseFloat(goalWeight) : null
  const bf = bodyFat != null && bodyFat !== '' ? parseFloat(bodyFat) : null
  if (goal != null && !Number.isFinite(goal)) {
    return NextResponse.json({ error: '目標體重無效' }, { status: 400 })
  }
  if (bf != null && !Number.isFinite(bf)) {
    return NextResponse.json({ error: '體脂無效' }, { status: 400 })
  }

  // 只更新自己這列
  const user = await prisma.user.update({
    where: { id: auth.userId },
    data: { startDate: startObj, goalWeight: goal, bodyFat: bf },
  })

  return NextResponse.json({
    startDate: user.startDate,
    goalWeight: user.goalWeight,
    bodyFat: user.bodyFat,
  })
}
