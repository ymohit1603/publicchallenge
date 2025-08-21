import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // upsert user into prisma
    const upsertedUser = await prisma.user.upsert({
      where: { id: body.id },
      update: {
        email: body.email,
        username: body.username,
        name: body.name,
        avatar: body.avatar,
        updatedAt: new Date(),
      },
      create: {
        id: body.id,
        email: body.email,
        username: body.username || `user_${body.id.slice(0, 8)}`,
        name: body.name || "Anonymous User",
        avatar: body.avatar,
      },
    });

    return NextResponse.json(upsertedUser);
  } catch (err) {
    console.error("Upsert user error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
