import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const { username, email, password } = await request.json()

    if (!username || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if admin already exists
    const { data: existingAdmin } = await supabase.from("admin_users").select("id").limit(1)

    if (existingAdmin && existingAdmin.length > 0) {
      return NextResponse.json({ error: "Admin already configured" }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12)

    // Create admin user
    const { error } = await supabase.from("admin_users").insert({
      username,
      email,
      password_hash: passwordHash,
    })

    if (error) {
      console.error("Error creating admin:", error)
      return NextResponse.json({ error: "Failed to create admin account" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
