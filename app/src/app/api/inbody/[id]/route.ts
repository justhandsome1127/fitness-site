import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: '參數無效' }, { status: 400 })
  }

  // userId 條件確保只能刪自己的(防 IDOR)
  await prisma.inBodyEntry.deleteMany({
    where: { id, userId: auth.userId },
  })
  return NextResponse.json({ ok: true })
}
