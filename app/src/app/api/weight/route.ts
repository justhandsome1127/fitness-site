import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const entries = await prisma.weightEntry.findMany({
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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { date, weight, type, note } = body

  const settings = await prisma.settings.findUnique({ where: { id: 1 } })
  if (!settings) {
    return NextResponse.json({ error: '尚未設定起始日' }, { status: 400 })
  }

  const entryDate = new Date(`${date}T00:00:00.000Z`)
  const dayNumber = dayNumberFromDate(entryDate, settings.startDate)

  const entry = await prisma.weightEntry.upsert({
    where: { dayNumber },
    update: { weight, type, note, date: entryDate },
    create: { dayNumber, weight, type: type ?? 'normal', note, date: entryDate },
  })

  return NextResponse.json(entry)
}
