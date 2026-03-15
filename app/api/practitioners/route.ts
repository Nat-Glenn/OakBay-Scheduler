import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const practitioners = await prisma.user.findMany({
      where: {
        role: "provider",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return Response.json(practitioners);
  } catch (err) {
    console.error("Failed to fetch practitioners:", err);
    return Response.json(
      { error: "Failed to fetch practitioners" },
      { status: 500 }
    );
  }
}