import { Box, Button } from "@mui/material";
import type { ButtonProps } from "@mui/material/Button";

import NextLink from "@/components/ui/NextLink";

type PrepLinkButtonProps = {
  href: "/login" | "/register";
  label: string;
  /** Aviso mostrado junto al enlace antes del clic. */
  prepNotice: string;
  variant?: ButtonProps["variant"];
  color?: ButtonProps["color"];
  size?: ButtonProps["size"];
  fullWidth?: boolean;
  noticeId: string;
};

// Botón-enlace a una ruta informativa (/login, /register) que aún no captura
// credenciales. Muestra un aviso visible de "en preparación" junto al enlace,
// asociado por aria-describedby, de modo que el estado se anuncia antes del
// clic tanto visualmente como para lectores de pantalla.
export function PrepLinkButton({
  href,
  label,
  prepNotice,
  variant = "contained",
  color = "primary",
  size = "large",
  fullWidth,
  noticeId,
}: PrepLinkButtonProps) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: fullWidth ? "stretch" : "flex-start",
        gap: 0.75,
        width: fullWidth ? "100%" : "auto",
      }}
    >
      <Button
        component={NextLink}
        href={href}
        // Las rutas informativas no necesitan prefetch.
        prefetch={false}
        variant={variant}
        color={color}
        size={size}
        fullWidth={fullWidth}
        aria-describedby={noticeId}
      >
        {label}
      </Button>
      <Box
        id={noticeId}
        component="span"
        sx={{
          fontSize: "0.8125rem",
          lineHeight: 1.4,
          color: "text.secondary",
        }}
      >
        {prepNotice}
      </Box>
    </Box>
  );
}
