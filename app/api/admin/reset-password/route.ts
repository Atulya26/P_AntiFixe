import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find admin with valid token
    const { data: admin, error } = await supabase.from("admin_users").select("*").eq("reset_token", token).single()

    if (error || !admin) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    // Check if token is expired
    const expires = new Date(admin.reset_token_expires)
    if (expires < new Date()) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 })
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update password and clear reset token
    await supabase
      .from("admin_users")
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", admin.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
