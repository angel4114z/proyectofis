import { Box, Container, Typography } from "@mui/material";

import { FAQ } from "../content";
import { FaqAccordion } from "../components/FaqAccordion";

// Preguntas frecuentes en una columna de lectura estrecha.
export function Faq() {
  return (
    <Box
      component="section"
      id="preguntas"
      aria-labelledby="preguntas-title"
      sx={{
        py: { xs: 6, md: 9 },
        scrollMarginTop: 80,
        bgcolor: "background.paper",
        borderBlock: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="md">
        <Typography id="preguntas-title" component="h2" variant="h2" sx={{ mb: 3 }}>
          Preguntas frecuentes
        </Typography>
        <FaqAccordion items={FAQ} />
      </Container>
    </Box>
  );
}
