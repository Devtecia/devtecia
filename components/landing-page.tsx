"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { About } from "@/components/about"
import { Contact } from "@/components/contact"
import { Footer } from "@/components/footer"
import { ThreeBackground } from "@/components/three-background"
import { useMobile } from "@/hooks/use-mobile"

export default function LandingPage() {
  const isMobile = useMobile()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-900 text-white">
      {!isMobile && isLoaded && (
        <div className="fixed inset-0 z-0">
          <ThreeBackground />
        </div>
      )}
      <div className="relative z-10">
        <Header />
        <main>
          <Hero />
          <Features />
          <About />
          <Contact />
        </main>
        <Footer />
      </div>
    </div>
  )
}

