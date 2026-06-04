import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: { date: string } }
) {
  const dateObj = new Date(params.date + 'T00:00:00.000Z')
  const log = await prisma.dailyLog.findFirst({
    where: {
      date: { gte: dateObj, lt: new Date(dateObj.getTime() + 86400000) },
    },
  })
  if (!log) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(log)
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { date: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const dateObj = new Date(params.date + 'T00:00:00.000Z')
  await prisma.dailyLog.deleteMany({
    where: {
      date: { gte: dateObj, lt: new Date(dateObj.getTime() + 86400000) },
    },
  })
  return NextResponse.json({ ok: true })
}
