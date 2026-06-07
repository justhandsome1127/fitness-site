import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { dayNumber: string } }
) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error

  const dayNumber = parseInt(params.dayNumber)
  if (!Number.isInteger(dayNumber)) {
    return NextResponse.json({ error: '參數無效' }, { status: 400 })
  }

  // userId 條件確保只能刪自己的(防 IDOR)
  await prisma.weightEntry.deleteMany({
    where: { dayNumber, userId: auth.userId },
  })
  return NextResponse.json({ ok: true })
}
