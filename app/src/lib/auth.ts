import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'

// 帳號不存在時仍跑一次 bcrypt 比對,避免用回應時間推測帳號是否存在(timing attack)
const DUMMY_HASH = '$2a$12$XqsuAoynnwZNIouILbCwG.7JX6Mwq32hDvS9DWyhZ0YNIXdByNTpG'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials, req) {
        // 登入限速:同一 IP 每 10 分鐘最多 10 次嘗試,擋暴力破解
        const headers = (req?.headers ?? {}) as Record<string, string>
        const ip =
          headers['cf-connecting-ip'] ||
          headers['x-forwarded-for']?.split(',')[0]?.trim() ||
          'unknown'
        if (!rateLimit(`login:${ip}`, 10, 10 * 60 * 1000)) return null

        const username = credentials?.username?.toLowerCase().trim()
        const password = credentials?.password
        if (!username || !password) return null

        const user = await prisma.user.findUnique({ where: { username } })
        const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
        if (!user || !ok) return null

        return {
          id: String(user.id),
          name: user.displayName,
          username: user.username,
          role: user.role,
        }
      },
    }),
  ],
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin' },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as unknown as { id: string; username: string; role: string }
        token.uid = Number(u.id)
        token.username = u.username
        token.role = u.role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as number
        session.user.username = token.username as string
        session.user.role = token.role as string
      }
      return session
    },
  },
}
