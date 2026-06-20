import path from "path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env") });
console.log('DOTENV DATABASE_URL', process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 20) + '...' : 'MISSING');

async function main() {
  const { prisma } = await import("../src/main/lib/prisma");
  const users = await prisma.user.findMany({ take: 1 });
  console.log("users", users.length);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
