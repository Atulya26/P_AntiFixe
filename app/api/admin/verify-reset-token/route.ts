import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")

    if (!token) {
      return NextResponse.json({ valid: false })
    }

    const supabase = await createClient()

    const { data: admin, error } = await supabase
      .from("admin_users")
      .select("reset_token_expires")
      .eq("reset_token", token)
      .single()

    if (error || !admin) {
      return NextResponse.json({ valid: false })
    }

    // Check if token is expired
    const expires = new Date(admin.reset_token_expires)
    if (expires < new Date()) {
      return NextResponse.json({ valid: false })
    }

    return NextResponse.json({ valid: true })
  } catch (error) {
    console.error("Verify token error:", error)
    return NextResponse.json({ valid: false })
  }
}
