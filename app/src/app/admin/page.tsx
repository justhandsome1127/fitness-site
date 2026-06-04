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

  const logs = await prisma.dailyLog.findMany({
    orderBy: { date: 'desc' },
    take: 30,
  })

  const serialized = logs.map((log) => ({
    ...log,
    date: log.date.toISOString(),
    exercises: log.exercises as { name: string; sets: number; reps: string; weight: string }[] | null,
  }))

  return <AdminDashboard initialLogs={serialized} />
}
