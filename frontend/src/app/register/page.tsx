import type { Metadata } from "next";

import { PrepScreen } from "@/features/landing/components/PrepScreen";

export const metadata: Metadata = {
  title: "Registro en preparación",
  description:
    "El registro de TinderUD está en preparación. Aún no captura credenciales.",
};

export default function RegisterPage() {
  return (
    <PrepScreen
      statusLabel="Registro en preparación"
      title="Crear cuenta estará disponible pronto"
      description="Estamos preparando el registro con correo y contraseña. Esta pantalla aún no captura credenciales. Vuelve más adelante para crear tu cuenta."
      alternate={{
        href: "/login",
        label: "Ver estado del acceso",
        notice: "Acceso en preparación",
      }}
    />
  );
}
