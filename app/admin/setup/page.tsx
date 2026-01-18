"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import { Eye, EyeOff, Lock, User, Mail, ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"

export default function AdminSetupPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [alreadySetup, setAlreadySetup] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(true)
  const router = useRouter()
  const supabase = getSupabaseBrowserClient()

  // Fixed credentials as per user request
  const ADMIN_USERNAME = "Atulya"
  const ADMIN_EMAIL = "atulya2612@gmail.com"

  useEffect(() => {
    checkAdminExists()
  }, [])

  const checkAdminExists = async () => {
    const { data, error } = await supabase.from("admin_users").select("id").limit(1)

    if (error) {
      console.error("Error checking admin:", error)
    }

    if (data && data.length > 0) {
      setAlreadySetup(true)
    }
    setCheckingSetup(false)
  }

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/admin/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: ADMIN_USERNAME,
          email: ADMIN_EMAIL,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Setup failed")
      }

      router.push("/admin/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed")
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

  if (alreadySetup) {
    router.push("/admin/login")
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
            <Shield className="w-10 h-10 mx-auto mb-4 text-neutral-500" />
            <h1
              className="text-xl font-light tracking-widest uppercase"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Admin Setup
            </h1>
            <p className="text-sm text-neutral-500 mt-2">Set your password to secure the admin panel</p>
          </div>

          <form onSubmit={handleSetup} className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="text"
                  value={ADMIN_USERNAME}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-sm text-neutral-400 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  value={ADMIN_EMAIL}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-neutral-800 border border-neutral-700 rounded-sm text-neutral-400 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">This email will be used for password recovery</p>
            </div>

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-12 py-3 bg-neutral-900 border border-neutral-700 rounded-sm focus:border-white focus:outline-none transition-colors"
                  required
                  minLength={8}
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

            <div>
              <label className="block text-sm text-neutral-400 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full pl-10 pr-4 py-3 bg-neutral-900 border border-neutral-700 rounded-sm focus:border-white focus:outline-none transition-colors"
                  required
                />
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
              {loading ? "Setting up..." : "Complete Setup"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
