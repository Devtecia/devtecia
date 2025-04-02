"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, MapPin, Phone, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

// Tipo para los errores de validación
type FormErrors = {
  name?: string
  email?: string
  message?: string
}

export function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    message: "",
  })
  
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const validateForm = () => {
    const newErrors: FormErrors = {}
    
    // Validación del nombre
    if (!formState.name.trim()) {
      newErrors.name = "El nombre es requerido"
    } else if (formState.name.trim().length < 2) {
      newErrors.name = "El nombre debe tener al menos 2 caracteres"
    }
    
    // Validación del email
    if (!formState.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email)) {
      newErrors.email = "El email no es válido"
    }
    
    // Validación del mensaje
    if (!formState.message.trim()) {
      newErrors.message = "El mensaje es requerido"
    } else if (formState.message.trim().length < 10) {
      newErrors.message = "El mensaje debe tener al menos 10 caracteres"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    
    setFormState({
      ...formState,
      [name]: value,
    })
    
    // Limpiar error específico al cambiar un campo
    if (errors[name as keyof FormErrors]) {
      setErrors({
        ...errors,
        [name]: undefined
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validar el formulario antes de enviar
    if (!validateForm()) return
    
    setIsSubmitting(true)
    setSubmitStatus('idle')
    
    try {
      // Enviar datos al endpoint de API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar el formulario')
      }
      
      console.log("Respuesta recibida:", data)
      setSubmitStatus('success')
      toast.success("Mensaje enviado con éxito", {
        description: data.message || "Nos pondremos en contacto contigo pronto."
      })
      
      // Resetear formulario
      setFormState({
        name: "",
        email: "",
        message: "",
      })
    } catch (error) {
      console.error("Error al enviar el formulario:", error)
      setSubmitStatus('error')
      toast.error("Error al enviar el mensaje", {
        description: error instanceof Error ? error.message : "Por favor, inténtalo de nuevo más tarde."
      })
    } finally {
      setIsSubmitting(false)
    }
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
                  className={`border-white/10 bg-white/5 backdrop-blur-sm ${errors.name ? 'border-red-500' : ''}`}
                  aria-invalid={!!errors.name}
                  aria-describedby={errors.name ? "name-error" : undefined}
                  disabled={isSubmitting}
                />
                {errors.name && (
                  <p id="name-error" className="mt-1 text-xs text-red-500">
                    {errors.name}
                  </p>
                )}
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
                  className={`border-white/10 bg-white/5 backdrop-blur-sm ${errors.email ? 'border-red-500' : ''}`}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1 text-xs text-red-500">
                    {errors.email}
                  </p>
                )}
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
                  className={`min-h-[120px] border-white/10 bg-white/5 backdrop-blur-sm ${errors.message ? 'border-red-500' : ''}`}
                  aria-invalid={!!errors.message}
                  aria-describedby={errors.message ? "message-error" : undefined}
                  disabled={isSubmitting}
                />
                {errors.message && (
                  <p id="message-error" className="mt-1 text-xs text-red-500">
                    {errors.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : submitStatus === 'success' ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mensaje Enviado
                  </>
                ) : submitStatus === 'error' ? (
                  <>
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Intentar de Nuevo
                  </>
                ) : (
                  'Enviar Mensaje'
                )}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

