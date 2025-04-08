import type React from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { TranslationProvider } from "@/utils/translation-context"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import './globals.css'
import { Toaster } from "@/components/ui/sonner"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Car Marketplace - Mercado de Autos",
  description: "Encuentra y compra autos usados de calidad",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={inter.className} style={{ maxWidth: '95vw', margin: 'auto' }}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <TranslationProvider>
            <Navbar />
            <Toaster />
            <main 
            className="flex justify-center min-h-screen mt-16 max-w-7xl mx-auto" 
            style={{ maxWidth: '95vw', margin: 'auto' }}>
              {children}
              </main>
            <Footer />
          </TranslationProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
