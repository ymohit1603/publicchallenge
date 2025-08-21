import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  try {
    const { data, error } = await supabase.auth.getSession();
    
    return NextResponse.json({ 
      session: data.session ? "exists" : "none",
      user: data.session?.user ? {
        id: data.session.user.id,
        email: data.session.user.email,
        metadata: Object.keys(data.session.user.user_metadata || {})
      } : null,
      error: error?.message || null,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json({ 
      error: "Failed to get session",
      details: err instanceof Error ? err.message : "Unknown error"
    });
  }
}
