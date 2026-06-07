import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { prisma } from '@/lib/prisma'
import { requireUserId } from '@/lib/session'

// 列出所有邀請碼(僅 admin)
export async function GET() {
  const auth = await requireUserId()
  if ('error' in auth) return auth.error
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const invites = await prisma.inviteCode.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(invites)
}

// 產生新邀請碼(僅 admin)
export async function POST(request: NextRequest) {
  const auth = await requireUserId(request)
  if ('error' in auth) return auth.error
  if (auth.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => ({}))
  const maxUses = Number.isInteger(body?.maxUses) ? body.maxUses : 1
  if (maxUses < 1 || maxUses > 100) {
    return NextResponse.json({ error: '可用次數需在 1-100 之間' }, { status: 400 })
  }
  const label =
    typeof body?.label === 'string' && body.label.trim()
      ? body.label.trim().slice(0, 50)
      : null

  // 隨機、不可猜的碼(URL-safe)
  const code = randomBytes(9).toString('base64url')

  const invite = await prisma.inviteCode.create({
    data: { code, maxUses, label },
  })
  return NextResponse.json(invite)
}
