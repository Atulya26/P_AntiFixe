"use client"

import type React from "react"

import { useState } from "react"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const response = await fetch("/api/admin/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send reset email")
      }

      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email")
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="border border-neutral-800 rounded-sm p-8 text-center">
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1
              className="text-xl font-light tracking-widest uppercase mb-4"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Email Sent
            </h1>
            <p className="text-neutral-400 text-sm mb-6">
              If an account exists with that email, you will receive a password reset link shortly.
            </p>
            <Link
              href="/admin/login"
              className="inline-block px-6 py-3 bg-white text-black font-medium rounded-sm hover:bg-neutral-200 transition-colors"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <Link
            href="/admin/login"
            className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>

        <div className="border border-neutral-800 rounded-sm p-8">
          <div className="text-center mb-8">
            <Mail className="w-10 h-10 mx-auto mb-4 text-neutral-500" />
            <h1
              className="text-xl font-light tracking-widest uppercase"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              Reset Password
            </h1>
            <p className="text-sm text-neutral-500 mt-2">Enter your email to receive a reset link</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm text-neutral-400 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
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
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
