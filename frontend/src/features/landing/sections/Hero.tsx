import { Box, Container, Link as MuiLink, Stack, Typography } from "@mui/material";

import { PrepLinkButton } from "../components/PrepLinkButton";
import { HeroComposition } from "../components/HeroComposition";

// Hero: el H1 y la explicación viven en HTML inicial. La composición es
// decorativa. CTA principal "Crear cuenta" → /register con aviso de estado.
export function Hero() {
  return (
    <Box component="section" aria-labelledby="hero-title" sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
            gap: { xs: 5, md: 6 },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              id="hero-title"
              component="h1"
              variant="h1"
              sx={{ mb: 2, maxWidth: 640 }}
            >
              Tu próxima conexión comienza en la U
            </Typography>

            <Typography
              variant="h3"
              component="p"
              sx={{ color: "text.secondary", fontWeight: 600, mb: 2 }}
            >
              Conecta más allá del aula.
            </Typography>

            <Typography variant="body1" sx={{ color: "text.secondary", maxWidth: 560, mb: 1.5 }}>
              Citas, amistades y networking académico y profesional para
              estudiantes de la Universidad Distrital Francisco José de Caldas.
            </Typography>

            <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 560, mb: 3 }}>
              Solo para personas de 18 años o más. TinderUD es un proyecto
              independiente.
            </Typography>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ alignItems: { xs: "stretch", sm: "flex-start" } }}
            >
              <PrepLinkButton
                href="/register"
                label="Crear cuenta"
                prepNotice="Registro en preparación"
                noticeId="hero-register-notice"
              />
              <MuiLink
                href="#modos"
                color="info.main"
                underline="always"
                sx={{ alignSelf: { sm: "center" }, fontWeight: 600, py: 1 }}
              >
                Explorar los tres modos
              </MuiLink>
            </Stack>
          </Box>

          <HeroComposition />
        </Box>
      </Container>
    </Box>
  );
}
