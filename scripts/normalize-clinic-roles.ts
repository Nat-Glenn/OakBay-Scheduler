/**
 * Legacy one-off — role values are now a Prisma enum (ClinicRole).
 * The enum migration already mapped `provider` → Chiropractor.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const chiropractors = await prisma.user.count({
    where: { role: "Chiropractor" },
  });
  const receptionists = await prisma.user.count({
    where: { role: "Receptionist" },
  });

  console.log(
    `Clinic roles are normalized (${chiropractors} Chiropractor, ${receptionists} Receptionist). No changes made.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
