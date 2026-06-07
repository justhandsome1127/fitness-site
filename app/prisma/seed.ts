import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import data from '../data/weight.json'

const prisma = new PrismaClient()

const breakDaySet = new Set(data.breakDays)

// Day 1 = 2026-03-17
const START_DATE = new Date('2026-03-17T00:00:00.000Z')

function getDate(dayNumber: number): Date {
  const d = new Date(START_DATE)
  d.setUTCDate(d.getUTCDate() + dayNumber - 1)
  return d
}

async function main() {
  // 確保有 yen 帳號。migration 會以佔位 hash 'SET_BY_SEED' 建立 yen;
  // 這裡把它換成依 ADMIN_PASSWORD 算出的真實 bcrypt hash。
  // 已是真實 hash(使用者可能自行改過密碼)則不動,避免每次部署重設密碼。
  const adminPassword = process.env.ADMIN_PASSWORD || 'changeme'
  let yen = await prisma.user.upsert({
    where: { username: 'yen' },
    update: {},
    create: {
      username: 'yen',
      displayName: 'yen',
      passwordHash: bcrypt.hashSync(adminPassword, 12),
      role: 'admin',
      startDate: START_DATE,
      goalWeight: 75,
    },
  })

  if (yen.passwordHash === 'SET_BY_SEED') {
    yen = await prisma.user.update({
      where: { id: yen.id },
      data: { passwordHash: bcrypt.hashSync(adminPassword, 12) },
    })
    console.log('Set yen password from ADMIN_PASSWORD.')
  }

  console.log('Seeding weight entries for yen...')

  for (let i = 0; i < data.weightData.length; i++) {
    const dayNumber = i + 1
    const entry = data.weightData[i]
    const type = breakDaySet.has(dayNumber) ? 'break' : 'normal'

    await prisma.weightEntry.upsert({
      where: { userId_dayNumber: { userId: yen.id, dayNumber } },
      update: { weight: entry.weight, note: entry.note, type, date: getDate(dayNumber) },
      create: {
        userId: yen.id,
        dayNumber,
        weight: entry.weight,
        note: entry.note,
        type,
        date: getDate(dayNumber),
      },
    })
  }

  console.log(`Seeded ${data.weightData.length} weight entries.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
