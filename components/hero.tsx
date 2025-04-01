"use client"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export function Hero() {
  const heroRef = useRef<HTMLDivElement>(null)

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden pt-16"
    >
      <div className="container px-4 py-24 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center space-y-4"
          >
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                  Creando el Futuro
                </span>
                <span>con Inteligencia Artificial</span>
              </h1>
              <p className="max-w-[600px] text-white/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Transformamos ideas en soluciones innovadoras con tecnología de vanguardia. Potencia tu negocio con
                nuestros productos de IA.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="border-white/20 hover:bg-white/10">
                Ver Demostración
              </Button>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative hidden h-[400px] overflow-hidden rounded-xl border border-white/10 bg-black/20 backdrop-blur-sm lg:block"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-600/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl font-bold text-white mb-4">AI</div>
                <div className="text-xl text-white/80">Visualización 3D</div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1, repeat: Number.POSITIVE_INFINITY, repeatType: "reverse" }}
        >
          <ArrowRight className="h-8 w-8 rotate-90 text-white/50" />
        </motion.div>
      </div>
    </section>
  )
}

