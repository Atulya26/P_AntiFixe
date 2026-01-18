"use client"

import type React from "react"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react"
import Link from "next/link"

function ResetPasswordForm() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  useEffect(() => {
    if (!token) {
      setTokenValid(false)
      return
    }
    verifyToken()
  }, [token])

  const verifyToken = async () => {
    try {
      const response = await fetch(`/api/admin/verify-reset-token?token=${token}`)
      const data = await response.json()
      setTokenValid(data.valid)
    } catch {
      setTokenValid(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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
      const response = await fetch("/api/admin/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password")
      }

      setSuccess(true)
      setTimeout(() => router.push("/admin/login"), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset password")
    } finally {
      setLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
        <div className="text-neutral-400">Verifying reset link...</div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="border border-neutral-800 rounded-sm p-8 text-center">
            <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1
              className="text-xl font-light tracking-widest uppercase mb-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Invalid Link
            </h1>
            <p className="text-neutral-400 text-sm mb-6">This reset link is invalid or has expired.</p>
            <Link
              href="/admin/forgot-password"
              className="inline-block px-6 py-3 bg-white text-black font-medium rounded-sm hover:bg-neutral-200 transition-colors"
            >
              Request New Link
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="border border-neutral-800 rounded-sm p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1
              className="text-xl font-light tracking-widest uppercase mb-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Password Reset
            </h1>
            <p className="text-neutral-400 text-sm">
              Your password has been reset successfully. Redirecting to login...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="border border-neutral-800 rounded-sm p-8">
          <div className="text-center mb-8">
            <Lock className="w-10 h-10 mx-auto mb-4 text-neutral-500" />
            <h1
              className="text-xl font-light tracking-widest uppercase"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              New Password
            </h1>
            <p className="text-sm text-neutral-500 mt-2">Enter your new password below</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
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
                  placeholder="Confirm new password"
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
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center">
          <div className="text-neutral-400">Loading...</div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
