import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { rateLimit, clientIp } from '@/lib/rate-limit'

const RESERVED = new Set(['admin', 'api', 'log', 'register', 'u', 'public', 'root', 'me'])

const schema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9_]{3,20}$/, '帳號限 3-20 字的英文小寫、數字或底線'),
  displayName: z.string().trim().min(1, '請填顯示名稱').max(30, '顯示名稱過長'),
  password: z.string().min(8, '密碼至少 8 碼').max(100, '密碼過長'),
  invite: z.string().trim().min(1, '請填邀請碼').max(64, '邀請碼無效'),
})

export async function POST(request: NextRequest) {
  // 限速:同一 IP 每小時最多 5 次註冊嘗試,擋機器人灌帳號
  if (!rateLimit(`register:${clientIp(request)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: '嘗試太頻繁,請稍後再試' }, { status: 429 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '格式錯誤' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? '輸入無效' },
      { status: 400 }
    )
  }
  const { username, displayName, password, invite } = parsed.data

  if (RESERVED.has(username)) {
    return NextResponse.json({ error: '此帳號名稱保留中,請換一個' }, { status: 400 })
  }

  const exists = await prisma.user.findUnique({ where: { username } })
  if (exists) {
    return NextResponse.json({ error: '帳號已被使用' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 12)
  // 新帳號的 Day 1 預設今天(UTC 日期)
  const today = new Date()
  const startDate = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  )

  try {
    // 原子地「認領」邀請碼一次再建帳號:單一 UPDATE 條件 usedCount < maxUses,
    // 避免兩人同時用掉最後一個名額。建帳號失敗(例如帳號競態撞名)會整筆 rollback,邀請碼不會被白白消耗。
    await prisma.$transaction(async (tx) => {
      const claimed = await tx.$executeRaw`
        UPDATE "InviteCode" SET "usedCount" = "usedCount" + 1
        WHERE "code" = ${invite} AND "usedCount" < "maxUses"`
      if (claimed === 0) throw new Error('INVALID_INVITE')
      await tx.user.create({
        data: { username, displayName, passwordHash, role: 'user', startDate },
      })
    })
  } catch (e) {
    if (e instanceof Error && e.message === 'INVALID_INVITE') {
      return NextResponse.json({ error: '邀請碼無效或已用完' }, { status: 403 })
    }
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json({ error: '帳號已被使用' }, { status: 409 })
    }
    throw e
  }

  return NextResponse.json({ ok: true, username })
}
