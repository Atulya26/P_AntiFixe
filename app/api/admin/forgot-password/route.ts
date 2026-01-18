import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Only allow reset for the configured email
    if (email !== "atulya2612@gmail.com") {
      // Return success even if email doesn't match (security best practice)
      return NextResponse.json({ success: true })
    }

    const supabase = await createClient()

    // Find admin user
    const { data: admin, error } = await supabase.from("admin_users").select("*").eq("email", email).single()

    if (error || !admin) {
      // Return success even if not found (security best practice)
      return NextResponse.json({ success: true })
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex")
    const resetTokenExpires = new Date(Date.now() + 3600000) // 1 hour

    // Store reset token
    await supabase
      .from("admin_users")
      .update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires.toISOString(),
      })
      .eq("id", admin.id)

    // In production, send email with reset link
    // For now, log the reset link
    const resetUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/admin/reset-password?token=${resetToken}`
    console.log("Password reset link:", resetUrl)

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // await sendEmail({
    //   to: email,
    //   subject: "Password Reset",
    //   html: `<a href="${resetUrl}">Reset your password</a>`,
    // })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
