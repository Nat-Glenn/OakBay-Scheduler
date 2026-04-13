import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/hash";

// Only letters, spaces, hyphens, and apostrophes — no numbers in names
const nameRegex = /^[a-zA-Z\s'\-]+$/;

// Basic email format check
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function GET() {
  try {
    const practitioners = await prisma.user.findMany({
      where: {
        role: { in: ["Chiropractor", "provider"] },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
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

    // Name: letters only, max 50 characters
    if (!nameRegex.test(name)) {
      return Response.json(
        { error: "Name can only contain letters, spaces, hyphens, and apostrophes" },
        { status: 400 }
      );
    }
    if (name.length > 50) {
      return Response.json(
        { error: "Name cannot exceed 50 characters" },
        { status: 400 }
      );
    }

    // Email format and length validation
    if (email.length > 254) {
      return Response.json(
        { error: "Email cannot exceed 254 characters" },
        { status: 400 }
      );
    }
    if (!emailRegex.test(email)) {
      return Response.json(
        { error: "Invalid email format" },
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
    
    //hash the password before storing
    const hashedPassword = await hashPassword("temp123");

    const practitioner = await prisma.user.create({
      data: {
        name,
        email,
        role: "provider",
        password: hashedPassword,
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