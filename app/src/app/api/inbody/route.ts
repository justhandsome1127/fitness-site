import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const entries = await prisma.inBodyEntry.findMany({
    orderBy: { date: 'asc' },
  })
  return NextResponse.json(entries)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { date, weight, bodyFat, muscle, visceral, note } = body

  const entry = await prisma.inBodyEntry.upsert({
    where: { date: new Date(date) },
    update: { weight, bodyFat, muscle, visceral, note },
    create: { date: new Date(date), weight, bodyFat, muscle, visceral, note },
  })

  return NextResponse.json(entry)
}
