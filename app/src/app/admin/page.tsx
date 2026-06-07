import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LoginForm } from './LoginForm'
import { AdminDashboard } from './AdminDashboard'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return <LoginForm />
  }
  const userId = session.user.id

  const isAdmin = session.user.role === 'admin'

  const [logs, weights, inbody, user, invites] = await Promise.all([
    prisma.dailyLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 30 }),
    prisma.weightEntry.findMany({ where: { userId }, orderBy: { dayNumber: 'desc' } }),
    prisma.inBodyEntry.findMany({ where: { userId }, orderBy: { date: 'desc' } }),
    prisma.user.findUnique({ where: { id: userId } }),
    isAdmin
      ? prisma.inviteCode.findMany({ orderBy: { createdAt: 'desc' } })
      : Promise.resolve([]),
  ])

  const serializedWeights = weights.map((w) => ({
    id: w.id,
    dayNumber: w.dayNumber,
    weight: w.weight,
    type: w.type,
    note: w.note,
    date: w.date ? w.date.toISOString() : null,
  }))

  const serializedSettings = user
    ? {
        startDate: user.startDate.toISOString(),
        goalWeight: user.goalWeight,
        bodyFat: user.bodyFat,
      }
    : null

  const serialized = logs.map((log) => ({
    ...log,
    date: log.date.toISOString(),
    exercises: log.exercises as { name: string; sets: number; reps: string; weight: string }[] | null,
    diet: log.diet as { meal: string; name: string; calories: number | null; protein: number | null }[] | null,
  }))

  const serializedInbody = inbody.map((e) => ({
    ...e,
    date: e.date.toISOString(),
    createdAt: e.createdAt.toISOString(),
  }))

  const serializedInvites = invites.map((i) => ({
    id: i.id,
    code: i.code,
    maxUses: i.maxUses,
    usedCount: i.usedCount,
    label: i.label,
  }))

  return (
    <AdminDashboard
      username={session.user.username}
      isAdmin={isAdmin}
      initialLogs={serialized}
      initialWeights={serializedWeights}
      initialInbody={serializedInbody}
      initialSettings={serializedSettings}
      initialInvites={serializedInvites}
    />
  )
}
