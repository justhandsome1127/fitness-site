import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

// 撤銷邀請碼(僅 admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: '參數無效' }, { status: 400 })
  }

  await prisma.inviteCode.deleteMany({ where: { id } })
  return NextResponse.json({ ok: true })
}
