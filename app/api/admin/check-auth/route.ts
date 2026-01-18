import { NextResponse } from "next/server"
import { verifyAdminAuth } from "@/lib/admin-auth"

export async function GET() {
  const admin = await verifyAdminAuth()

  if (!admin) {
    return NextResponse.json({ authenticated: false })
  }

  return NextResponse.json({ authenticated: true, username: admin.username })
}
