import { Box } from "@mui/material";

// Composición decorativa estática (CSS): tres nodos del mismo tamaño que
// representan los modos, sin fotos, datos de perfil, controles simulados ni
// estadísticas. aria-hidden porque es puramente decorativa; los títulos viven
// en HTML. Sin animación de entrada: los nodos se pintan visibles desde el
// inicio, lo que evita ocultar contenido y es correcto con movimiento
// reducido. Componente servidor: no necesita hooks ni Motion.
export function HeroComposition() {
  return (
    <Box
      aria-hidden
      sx={{
        position: "relative",
        width: "100%",
        maxWidth: 460,
        aspectRatio: "1 / 1",
        mx: "auto",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          // sx estático y serializable: no cruza una función a un Client
          // Component. El fondo usa variables CSS de la paleta que MUI
          // intercambia por esquema (claro/oscuro), así que el degradado se
          // adapta automáticamente sin theme.applyStyles.
          background:
            "radial-gradient(circle at 50% 40%, color-mix(in srgb, var(--mui-palette-info-main) 14%, transparent), color-mix(in srgb, var(--mui-palette-secondary-main) 10%, transparent) 60%, transparent 72%)",
        }}
      />

      {NODES.map((node) => (
        <Box
          key={node.key}
          sx={{
            position: "absolute",
            left: `${node.x}%`,
            top: `${node.y}%`,
            transform: "translate(-50%, -50%)",
            width: NODE_SIZE,
            height: NODE_SIZE,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            bgcolor: node.fill,
            color: node.ink,
            border: "2px solid",
            borderColor: "background.paper",
            boxShadow: 3,
            fontWeight: 700,
            fontSize: "1.1rem",
          }}
        >
          {node.glyph}
        </Box>
      ))}
    </Box>
  );
}

const NODE_SIZE = 96;

// Tres nodos de igual tamaño y jerarquía, en triángulo equilátero.
const NODES = [
  { key: "a", x: 50, y: 24, glyph: "C", fill: "secondary.main", ink: "secondary.contrastText" },
  { key: "b", x: 28, y: 68, glyph: "A", fill: "info.main", ink: "info.contrastText" },
  { key: "c", x: 72, y: 68, glyph: "N", fill: "primary.main", ink: "primary.contrastText" },
] as const;
