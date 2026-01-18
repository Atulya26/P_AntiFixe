import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Space_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const montserrat = Montserrat({ 
  subsets: ["latin"], 
  weight: ["200", "300", "400", "500", "600"],
  variable: "--font-montserrat"
})

const spaceMono = Space_Mono({ 
  subsets: ["latin"], 
  weight: ["400", "700"],
  variable: "--font-space-mono"
})

export const metadata: Metadata = {
  title: "Atulya's Design",
  description: "An immersive 3D fashion gallery experience",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${montserrat.variable} ${spaceMono.variable} antialiased bg-black`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
