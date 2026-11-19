import {
  Box,
  Button,
  Chip,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

import NextLink from "@/components/ui/NextLink";

type PrepScreenProps = {
  statusLabel: string;
  title: string;
  description: string;
  /** Destino alternativo informativo (login/register). */
  alternate: {
    href: "/login" | "/register";
    label: string;
    notice: string;
  };
};

// Pantalla informativa temporal: no captura credenciales. Comunica el estado
// "en preparación" y ofrece volver al inicio.
export function PrepScreen({
  statusLabel,
  title,
  description,
  alternate,
}: PrepScreenProps) {
  return (
    <Box
      component="main"
      id="contenido"
      sx={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        py: { xs: 6, md: 10 },
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={3}>
          <Chip
            label={statusLabel}
            variant="outlined"
            sx={{
              alignSelf: "flex-start",
              fontWeight: 600,
              // El dorado (secondary) sobre fondo claro da 1.68:1, ilegible.
              // Se usa el color de enlace/foco (info.main): 7.11:1 en claro y
              // 10.09:1 en oscuro, con borde del mismo token.
              color: "info.main",
              borderColor: "info.main",
            }}
          />
          <Typography component="h1" variant="h1" sx={{ fontSize: "clamp(2rem, 1.4rem + 2.4vw, 3rem)" }}>
            {title}
          </Typography>
          <Typography variant="body1" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
          >
            <Button
              component={NextLink}
              href="/"
              variant="contained"
              color="primary"
              startIcon={<ArrowBackRoundedIcon />}
            >
              Volver al inicio
            </Button>
            <Box>
              <Button
                component={NextLink}
                href={alternate.href}
                prefetch={false}
                variant="text"
                color="primary"
                aria-describedby="prep-alt-notice"
              >
                {alternate.label}
              </Button>
              <Box
                id="prep-alt-notice"
                component="span"
                sx={{
                  display: "block",
                  fontSize: "0.8125rem",
                  color: "text.secondary",
                }}
              >
                {alternate.notice}
              </Box>
            </Box>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
