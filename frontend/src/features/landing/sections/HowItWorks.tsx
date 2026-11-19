import {
  Box,
  Container,
  Stack,
  Typography,
} from "@mui/material";

import { STEPS } from "../content";

// Cómo funciona: cuatro pasos presentados como la experiencia prevista.
export function HowItWorks() {
  return (
    <Box
      component="section"
      id="como-funciona"
      aria-labelledby="como-funciona-title"
      sx={{
        py: { xs: 6, md: 9 },
        scrollMarginTop: 80,
        bgcolor: "background.paper",
        borderBlock: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Typography
          id="como-funciona-title"
          component="h2"
          variant="h2"
          sx={{ mb: 1.5 }}
        >
          Cómo funciona
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 4, maxWidth: 680 }}>
          Un perfil común con información específica por modo y tres recorridos
          independientes. Así sería la experiencia prevista.
        </Typography>

        <Box
          component="ol"
          sx={{
            listStyle: "none",
            m: 0,
            p: 0,
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, 1fr)" },
            gap: 3,
          }}
        >
          {STEPS.map((step) => (
            <Box component="li" key={step.order}>
              <Stack spacing={1.5}>
                <Box
                  aria-hidden
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "secondary.main",
                    color: "secondary.contrastText",
                    fontWeight: 700,
                  }}
                >
                  {step.order}
                </Box>
                <Typography component="h3" variant="h4">
                  {step.title}
                </Typography>
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  {step.description}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
