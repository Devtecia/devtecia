"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export function About() {
  return (
    <section id="about" className="relative py-24 bg-black">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center space-y-4"
          >
            <div className="space-y-2">
              <div className="inline-block rounded-lg bg-white/5 px-3 py-1 text-sm backdrop-blur-sm">
                Nuestra Historia
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                  Quiénes Somos
                </span>
              </h2>
              <p className="max-w-[600px] text-white/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Devtecia nació con la visión de democratizar el acceso a la
                inteligencia artificial. Somos un equipo de innovadores,
                científicos de datos y desarrolladores apasionados por crear
                soluciones que transformen industrias.
              </p>
              <p className="max-w-[600px] text-white/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Desde nuestra fundación, hemos estado a la vanguardia de la
                revolución tecnológica, desarrollando productos que combinan la
                potencia de la IA con interfaces intuitivas y accesibles.
              </p>
            </div>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
                <span className="text-sm font-medium">
                  Innovación Constante
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-purple-400"></div>
                <span className="text-sm font-medium">Excelencia Técnica</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-cyan-400"></div>
                <span className="text-sm font-medium">Enfoque Humano</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm lg:aspect-square"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-purple-600/20"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src="/about.jpg?height=400&width=400"
                width={400}
                height={400}
                alt="Equipo Devtecia"
                className="rounded-lg object-cover"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
