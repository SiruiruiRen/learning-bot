import type React from "react"
import "./globals.css"
import { Inter } from "next/font/google"
import ClientLayout from "./client-layout"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "SoLBot - Science of Learning",
  description: "Learn how to learn effectively with SoLBot",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className={inter.className}>
        <ClientLayout children={children} />
      </body>
    </html>
  )
}