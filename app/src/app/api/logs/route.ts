import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const logs = await prisma.dailyLog.findMany({
    orderBy: { date: 'desc' },
  })
  return NextResponse.json(logs)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { date, exercises, dietNote, bodyNote, photos } = body

  const dateObj = new Date(date + 'T00:00:00.000Z')

  const log = await prisma.dailyLog.upsert({
    where: { date: dateObj },
    update: { exercises, dietNote, bodyNote, photos: photos ?? [] },
    create: {
      date: dateObj,
      exercises,
      dietNote,
      bodyNote,
      photos: photos ?? [],
    },
  })

  return NextResponse.json({ ...log, date: log.date.toISOString() })
}
