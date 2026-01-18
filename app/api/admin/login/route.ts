import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { SignJWT } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "Missing credentials" }, { status: 400 })
    }

    const supabase = await createClient()

    // Find admin user
    const { data: admin, error } = await supabase.from("admin_users").select("*").eq("username", username).single()

    if (error || !admin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, admin.password_hash)

    if (!validPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Create JWT token
    const token = await new SignJWT({
      adminId: admin.id,
      username: admin.username,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(JWT_SECRET)

    // Set cookie
    const cookieStore = await cookies()
    cookieStore.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
