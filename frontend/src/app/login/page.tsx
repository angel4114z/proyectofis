import type { Metadata } from "next";

import { PrepScreen } from "@/features/landing/components/PrepScreen";

export const metadata: Metadata = {
  title: "Acceso en preparación",
  description:
    "El inicio de sesión de TinderUD está en preparación. Aún no captura credenciales.",
};

export default function LoginPage() {
  return (
    <PrepScreen
      statusLabel="Acceso en preparación"
      title="Iniciar sesión estará disponible pronto"
      description="Estamos preparando el acceso con correo y contraseña. Esta pantalla aún no captura credenciales. Vuelve más adelante para iniciar sesión."
      alternate={{
        href: "/register",
        label: "Ver estado del registro",
        notice: "Registro en preparación",
      }}
    />
  );
}
