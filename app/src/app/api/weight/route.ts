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

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { dayNumber, weight, type, note } = body

  const entry = await prisma.weightEntry.upsert({
    where: { dayNumber },
    update: { weight, type, note },
    create: { dayNumber, weight, type: type ?? 'normal', note },
  })

  return NextResponse.json(entry)
}
