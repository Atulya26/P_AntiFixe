import { cookies } from "next/headers"
import { jwtVerify } from "jose"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key-change-in-production")

export async function verifyAdminAuth() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("admin_token")?.value

    if (!token) {
      return null
    }

    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { adminId: string; username: string }
  } catch {
    return null
  }
}
