const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const providers = [
    {
      name: "Brad Pritchard",
      email: "testing@oakbay.local",
      password: "password123",
      role: "provider",
    },
    {
      name: "Tyler Vickerson",
      email: "testing2@oakbay.local",
      password: "password123",
      role: "provider",
    },
  ];

  for (const provider of providers) {
    const existing = await prisma.user.findUnique({
      where: { email: provider.email },
    });

    if (existing) {
      console.log(`Already exists: ${provider.email}`);
      continue;
    }

    const created = await prisma.user.create({
      data: provider,
    });

    console.log(`Created provider: ${created.name} (id: ${created.id})`);
  }
}

main()
  .catch((e) => {
    console.error("Failed to create providers:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });