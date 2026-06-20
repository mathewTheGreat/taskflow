import path from "path";
import { config } from "dotenv";
config({ path: path.resolve(process.cwd(), ".env") });

async function main() {
  const { prisma } = await import("../src/main/lib/prisma");
  console.log('prisma loaded');
  const users = await prisma.user.findMany({ take: 1 });
  console.log('users', users.length);
  await prisma.$disconnect();
}

main().catch(err => {
  console.error('debug-prisma-query failed', err);
  process.exit(1);
});
