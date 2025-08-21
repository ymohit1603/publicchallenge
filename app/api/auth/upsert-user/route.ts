import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Validate required fields
    if (!body.id || !body.email) {
      return NextResponse.json(
        { error: "Missing required fields: id and email" },
        { status: 400 }
      );
    }

    // Generate fallback username if not provided or invalid
    const generateUsername = (email: string, id: string, username?: string) => {
      if (username && username.trim().length > 0) {
        // Clean username: remove special chars, make lowercase
        const cleanUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
        if (cleanUsername.length >= 3) {
          return cleanUsername;
        }
      }
      
      // Fallback to email username part
      const emailUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (emailUsername.length >= 3) {
        return emailUsername;
      }
      
      // Final fallback
      return `user_${id.slice(0, 8)}`;
    };

    const username = generateUsername(body.email, body.id, body.username);
    const name = body.name?.trim() || body.email.split('@')[0] || "Anonymous User";

    // Check if username already exists (for create case)
    const existingUser = await prisma.user.findUnique({
      where: { id: body.id },
      select: { id: true, username: true }
    });

    let finalUsername = username;
    
    // If creating new user, ensure username is unique
    if (!existingUser) {
      const existingUsername = await prisma.user.findUnique({
        where: { username }
      });
      
      if (existingUsername) {
        // Add random suffix to make it unique
        finalUsername = `${username}_${Math.random().toString(36).substring(2, 6)}`;
      }
    } else {
      // If updating, keep existing username
      finalUsername = existingUser.username;
    }
    
    // upsert user into prisma
    const upsertedUser = await prisma.user.upsert({
      where: { id: body.id },
      update: {
        email: body.email,
        name: name,
        avatar: body.avatar || null,
        updatedAt: new Date(),
      },
      create: {
        id: body.id,
        email: body.email,
        username: finalUsername,
        name: name,
        avatar: body.avatar || null,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        avatar: true,
        hasOngoingChallenge: true,
        profileVisitCount: true,
        createdAt: true,
      }
    });

    return NextResponse.json({ 
      success: true, 
      user: upsertedUser 
    });
  } catch (err: any) {
    console.error("Upsert user error:", err);
    
    // Handle specific Prisma errors
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: "Username or email already exists" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to save user data" },
      { status: 500 }
    );
  }
}
