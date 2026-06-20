import { prisma } from '../src/main/lib/prisma'

async function main() {
  try {
    console.log('Testing Prisma connection...')
    const user = await prisma.user.findFirst()
    console.log('Prisma query result:', user)
  } catch (err) {
    console.error('Prisma query error:', err)
  } finally {
    await prisma.$disconnect()
  }
}

main()
