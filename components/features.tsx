"use client"

import { motion } from "framer-motion"
import { Brain, Cpu, Database, Globe, Lock, Zap } from "lucide-react"

export function Features() {
  const features = [
    {
      icon: <Brain className="h-10 w-10 text-cyan-400" />,
      title: "Aprendizaje Automático",
      description: "Algoritmos avanzados que aprenden y mejoran con cada interacción.",
    },
    {
      icon: <Cpu className="h-10 w-10 text-purple-400" />,
      title: "Procesamiento Inteligente",
      description: "Análisis de datos en tiempo real para decisiones más rápidas y precisas.",
    },
    {
      icon: <Database className="h-10 w-10 text-cyan-400" />,
      title: "Big Data",
      description: "Gestión y análisis de grandes volúmenes de datos con facilidad.",
    },
    {
      icon: <Globe className="h-10 w-10 text-purple-400" />,
      title: "Soluciones Globales",
      description: "Tecnología adaptable a cualquier mercado y región del mundo.",
    },
    {
      icon: <Lock className="h-10 w-10 text-cyan-400" />,
      title: "Seguridad Avanzada",
      description: "Protección de datos con los más altos estándares de seguridad.",
    },
    {
      icon: <Zap className="h-10 w-10 text-purple-400" />,
      title: "Alto Rendimiento",
      description: "Optimización de recursos para un rendimiento excepcional.",
    },
  ]

  return (
    <section id="features" className="relative py-24 bg-gradient-to-b from-slate-900 to-black">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-white/5 px-3 py-1 text-sm backdrop-blur-sm">
              Tecnología de Vanguardia
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                Características Innovadoras
              </span>
            </h2>
            <p className="max-w-[900px] text-white/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Nuestras soluciones de IA están diseñadas para transformar la forma en que trabajas, optimizando procesos
              y maximizando resultados.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group relative overflow-hidden rounded-lg border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition-all hover:bg-white/10"
            >
              <div className="mb-4">{feature.icon}</div>
              <h3 className="mb-2 text-xl font-bold">{feature.title}</h3>
              <p className="text-sm text-white/70">{feature.description}</p>
              <div className="absolute -bottom-2 -right-2 h-24 w-24 rounded-full bg-gradient-to-r from-cyan-500/20 to-purple-600/20 opacity-0 blur-xl transition-opacity group-hover:opacity-100"></div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

