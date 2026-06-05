import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { LoginForm } from './LoginForm'
import { AdminDashboard } from './AdminDashboard'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return <LoginForm />
  }

  const [logs, weights, inbody] = await Promise.all([
    prisma.dailyLog.findMany({ orderBy: { date: 'desc' }, take: 30 }),
    prisma.weightEntry.findMany({ orderBy: { dayNumber: 'desc' } }),
    prisma.inBodyEntry.findMany({ orderBy: { date: 'desc' } }),
  ])

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

  return (
    <AdminDashboard
      initialLogs={serialized}
      initialWeights={weights}
      initialInbody={serializedInbody}
    />
  )
}
