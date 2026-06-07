import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

// 公開讀取:某使用者某天的日誌。GET ?username=
export async function GET(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  const username = request.nextUrl.searchParams.get('username')?.toLowerCase()
  if (!username) return NextResponse.json({ error: 'username required' }, { status: 400 })
  const user = await prisma.user.findUnique({ where: { username } })
  if (!user) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dateObj = new Date(params.date + 'T00:00:00.000Z')
  if (isNaN(dateObj.getTime())) return NextResponse.json({ error: 'Bad date' }, { status: 400 })

  const log = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId: user.id, date: dateObj } },
  })
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(log)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { date: string } }
) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error

  const dateObj = new Date(params.date + 'T00:00:00.000Z')
  if (isNaN(dateObj.getTime())) return NextResponse.json({ error: 'Bad date' }, { status: 400 })

  // userId 條件確保只能刪自己的(防 IDOR)
  await prisma.dailyLog.deleteMany({
    where: { userId: auth.userId, date: dateObj },
  })
  return NextResponse.json({ ok: true })
}
