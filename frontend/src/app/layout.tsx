import type { Metadata, Viewport } from "next";
import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";

import { AppProviders } from "@/providers/AppProviders";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "TinderUD · Conecta más allá del aula",
    template: "%s · TinderUD",
  },
  description:
    "TinderUD es una plataforma independiente para estudiantes de la Universidad Distrital Francisco José de Caldas, de 18 años o más. Citas, amistades y networking académico y profesional.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: la clase de esquema de color se escribe en el
    // cliente antes de hidratar; solo se suprime en <html>.
    <html lang="es" suppressHydrationWarning>
      <body>
        {/* Primer hijo de <body>, alineado con defaultMode="system"
            y colorSchemeSelector="class" del tema. Evita el flash de tema. */}
        <InitColorSchemeScript attribute="class" defaultMode="system" />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
