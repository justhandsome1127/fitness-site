import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } })
  return NextResponse.json(settings)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { startDate, goalWeight, bodyFat } = body

  const data = {
    startDate: new Date(`${startDate}T00:00:00.000Z`),
    goalWeight: goalWeight != null && goalWeight !== '' ? parseFloat(goalWeight) : null,
    bodyFat: bodyFat != null && bodyFat !== '' ? parseFloat(bodyFat) : null,
  }

  const settings = await prisma.settings.upsert({
    where: { id: 1 },
    update: data,
    create: { id: 1, ...data },
  })

  return NextResponse.json(settings)
}
