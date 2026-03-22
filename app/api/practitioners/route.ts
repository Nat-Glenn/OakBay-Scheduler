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
        id: "asc",
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

export async function POST(req: Request) {
  try{
    const body = await req.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();

    if (!name) {
      return Response.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!email) {
      return Response.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const exisitngUser = await prisma.user.findUnique({
      where : { email },
    });

    if (exisitngUser) {
      return Response.json(
        { error: "A user with this email already exists" },
        { status: 409 }
      );
    }

    const practitioner = await prisma.user.create({
      data: {
        name,
        email,
        role: "provider",
        password: "temp123",
      },
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    return Response.json(practitioner, { status: 201 });
  } catch (err) {
    console.error("Failed to create practitioner:", err);
    return Response.json(
      { error: "Failed to create practitioner" },
      { status: 500 }
    );
  }
}