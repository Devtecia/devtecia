import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/manrope";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.devtecia.com"),
  title: "Devtecia | Productos digitales que mueven negocios",
  description:
    "Estrategia, diseño UX/UI e ingeniería para construir productos SaaS, ecommerce y software a medida.",
  openGraph: {
    title: "Devtecia | Productos digitales que mueven negocios",
    description:
      "Diseñamos y construimos productos digitales con claridad estratégica, carácter visual e ingeniería preparada para crecer.",
    type: "website",
    locale: "es_CO",
    images: [
      {
        url: "/devtecia-software-system.png",
        width: 1280,
        height: 720,
        alt: "Devtecia — Productos digitales con dirección",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Devtecia | Productos digitales que mueven negocios",
    description:
      "Estrategia, diseño e ingeniería para productos digitales que deben crecer.",
    images: ["/devtecia-software-system.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
