"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Lock, User, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function AdminLoginPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  useEffect(() => {
    checkAdminExists()
  }, [])

  const checkAdminExists = async () => {
    const { data, error } = await supabase.from("admin_users").select("id").limit(1)

    if (error) {
      console.error("Error checking admin:", error)
    }

    setNeedsSetup(!data || data.length === 0)
    setCheckingSetup(false)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Login failed")
      }

      router.push("/admin")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed")
    } finally {
      setLoading(false)
    }
  }

  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-neutral-400">Loading...</div>
      </div>
    )
  }

  if (needsSetup) {
    router.push("/admin/setup")
    return null
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Gallery
          </Link>
        </div>

        <div className="border border-neutral-800 rounded-sm p-8">
          <div className="text-center mb-8">
            <Lock className="w-10 h-10 mx-auto mb-4 text-neutral-500" />
            <h1
              className="text-xl font-light tracking-widest uppercase"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Admin Login
            </h1>
            <p className="text-sm text-neutral-500 mt-2">Enter your credentials to access the admin panel</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-sm focus:border-white focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full pl-10 pr-12 py-3 bg-neutral-900 border border-neutral-700 rounded-sm focus:border-white focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-red-400 text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-white text-black font-medium rounded-sm hover:bg-neutral-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/admin/forgot-password" className="text-sm text-neutral-400 hover:text-white transition-colors">
              Forgot password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
