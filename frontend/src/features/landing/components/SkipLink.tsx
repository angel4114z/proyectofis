import { Box } from "@mui/material";

// Enlace "Saltar al contenido": visible solo al recibir foco por teclado.
// Componente servidor: ancla HTML a un landmark interno.
export function SkipLink() {
  return (
    <Box
      component="a"
      href="#contenido"
      sx={{
        position: "absolute",
        left: 8,
        top: 8,
        zIndex: 2000,
        px: 2,
        py: 1,
        borderRadius: 1,
        bgcolor: "background.paper",
        color: "info.main",
        fontWeight: 600,
        textDecoration: "none",
        boxShadow: 3,
        transform: "translateY(-150%)",
        transition: "transform 150ms ease",
        "&:focus-visible": {
          transform: "translateY(0)",
          outline: "2px solid",
          outlineColor: "info.main",
          outlineOffset: "2px",
        },
      }}
    >
      Saltar al contenido
    </Box>
  );
}
