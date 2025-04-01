"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MapPin, Phone } from "lucide-react"

export function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormState({
      ...formState,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para enviar el formulario
    console.log(formState)
    alert("Mensaje enviado con éxito")
    setFormState({
      name: "",
      email: "",
      message: "",
    })
  }

  return (
    <section id="contact" className="relative py-24 bg-gradient-to-b from-black to-slate-900">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-white/5 px-3 py-1 text-sm backdrop-blur-sm">Hablemos</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-600">
                Contáctanos
              </span>
            </h2>
            <p className="max-w-[600px] text-white/70 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              ¿Listo para transformar tu negocio con IA? Estamos aquí para ayudarte a dar el siguiente paso.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl gap-6 py-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
          >
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Información de Contacto</h3>
              <p className="text-sm text-white/70">Estamos disponibles para atenderte en cualquier momento.</p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-cyan-400" />
                <span className="text-sm">info@devtecia.com</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-purple-400" />
                <span className="text-sm">+34 123 456 789</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-cyan-400" />
                <span className="text-sm">Calle Tecnología 123, Madrid, España</span>
              </div>
            </div>
            <div className="h-40 overflow-hidden rounded-lg border border-white/10">
              <div className="h-full w-full bg-slate-800"></div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">
                  Nombre
                </label>
                <Input
                  id="name"
                  name="name"
                  placeholder="Tu nombre"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  className="border-white/10 bg-white/5 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formState.email}
                  onChange={handleChange}
                  required
                  className="border-white/10 bg-white/5 backdrop-blur-sm"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="message" className="text-sm font-medium">
                  Mensaje
                </label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="¿Cómo podemos ayudarte?"
                  value={formState.message}
                  onChange={handleChange}
                  required
                  className="min-h-[120px] border-white/10 bg-white/5 backdrop-blur-sm"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
              >
                Enviar Mensaje
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

