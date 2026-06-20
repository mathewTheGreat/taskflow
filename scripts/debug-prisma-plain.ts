import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";

config({ path: path.resolve(process.cwd(), ".env") });
console.log('DATABASE_URL', process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 20) + '...' : 'MISSING');

async function main() {
  const prisma = new PrismaClient({ log: ['query'] });
  await prisma.$connect();
  console.log('connected plain prisma');
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
