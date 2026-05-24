/**
 * One-off: set legacy User.role `provider` to `Chiropractor`.
 * Run: npx dotenv -e .env.local -- npx tsx scripts/normalize-clinic-roles.ts
 */

import { PrismaClient } from "@prisma/client";
import { ClinicDbRole } from "../lib/auth/constants";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { role: "provider" },
    data: { role: ClinicDbRole.CHIROPRACTOR },
  });

  console.log(`Updated ${result.count} user(s) from provider → Chiropractor.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
