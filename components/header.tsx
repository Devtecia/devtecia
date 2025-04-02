"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import Image from "next/image";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-black/30 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logoDevtecia.svg"
            width={120}
            height={60}
            alt="Equipo Devtecia"
            className="rounded-lg object-cover"
          />
        </Link>
        <nav className="hidden md:flex md:items-center md:gap-6">
          <Link
            href="#features"
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Características
          </Link>
          <Link
            href="#about"
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Nosotros
          </Link>
          <Link
            href="#contact"
            className="text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            Contacto
          </Link>
          {/*    <Button
            variant="outline"
            className="border-cyan-500 text-cyan-400 hover:bg-cyan-950 hover:text-cyan-300"
          >
            Iniciar Sesión
          </Button> */}
        </nav>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle Menu"
        >
          {isMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </Button>
        {isMenuOpen && (
          <div className="absolute inset-x-0 top-16 z-50 bg-black/90 p-4 backdrop-blur-md md:hidden">
            <nav className="flex flex-col space-y-4">
              <Link
                href="#features"
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Características
              </Link>
              <Link
                href="#about"
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Nosotros
              </Link>
              <Link
                href="#contact"
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                onClick={() => setIsMenuOpen(false)}
              >
                Contacto
              </Link>
              {/*    <Button
                variant="outline"
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-950 hover:text-cyan-300 bg-transparent"
              >
                Iniciar Sesión
              </Button> */}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
