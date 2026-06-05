import { PrismaClient } from '@prisma/client'
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
  // 確保有一列設定(已存在則不動,不覆蓋使用者填的目標/體脂)
  await prisma.settings.upsert({
    where: { id: 1 },
    update: {},
    create: { id: 1, startDate: START_DATE },
  })

  console.log('Seeding weight entries...')

  for (let i = 0; i < data.weightData.length; i++) {
    const dayNumber = i + 1
    const entry = data.weightData[i]
    const type = breakDaySet.has(dayNumber) ? 'break' : 'normal'

    await prisma.weightEntry.upsert({
      where: { dayNumber },
      update: { weight: entry.weight, note: entry.note, type, date: getDate(dayNumber) },
      create: {
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
