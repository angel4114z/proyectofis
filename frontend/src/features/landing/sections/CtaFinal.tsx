import { Box, Container, Link as MuiLink, Stack, Typography } from "@mui/material";

import { PrepLinkButton } from "../components/PrepLinkButton";

// CTA final: mismo destino y lenguaje del hero. Un único CTA "Crear cuenta"
// y acceso a inicio de sesión como enlace secundario.
export function CtaFinal() {
  return (
    <Box
      component="section"
      aria-labelledby="cta-final-title"
      sx={{ py: { xs: 7, md: 10 } }}
    >
      <Container maxWidth="md">
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          <Typography id="cta-final-title" component="h2" variant="h2">
            Conecta más allá del aula
          </Typography>
          <Stack spacing={1} sx={{ alignItems: "center" }}>
            <PrepLinkButton
              href="/register"
              label="Crear cuenta"
              prepNotice="Registro en preparación"
              noticeId="cta-final-register-notice"
            />
          </Stack>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            ¿Ya tienes cuenta?{" "}
            <MuiLink
              href="/login"
              color="info.main"
              underline="always"
              sx={{ display: "inline-block", py: "2px" }}
            >
              Iniciar sesión
            </MuiLink>{" "}
            (acceso en preparación)
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
