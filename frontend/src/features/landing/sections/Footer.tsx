import { Box, Container, Divider, Stack, Typography } from "@mui/material";

import { INDEPENDENCE_NOTICE, LEGAL_LINKS } from "../content";

// Footer: marca, enlaces legales pendientes como texto (sin href vacío) y
// aviso de independencia institucional.
export function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: { xs: 5, md: 6 },
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
          }}
        >
          <Typography variant="h4" component="p" sx={{ fontWeight: 700 }}>
            TinderUD
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            component="ul"
            sx={{ listStyle: "none", m: 0, p: 0 }}
          >
            {LEGAL_LINKS.map((label) => (
              <Box component="li" key={label}>
                {/* Enlaces legales pendientes: texto con estado, sin href vacío. */}
                <Typography
                  component="span"
                  variant="body2"
                  sx={{ color: "text.secondary" }}
                >
                  {label} (próximamente)
                </Typography>
              </Box>
            ))}
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 720 }}>
          {INDEPENDENCE_NOTICE}
        </Typography>
      </Container>
    </Box>
  );
}
