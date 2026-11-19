import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import FavoriteBorderRoundedIcon from "@mui/icons-material/FavoriteBorderRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import HubRoundedIcon from "@mui/icons-material/HubRounded";

import { MODES, type ModeKind } from "../content";

const ICONS: Record<ModeKind, React.ReactNode> = {
  citas: <FavoriteBorderRoundedIcon fontSize="large" />,
  amistades: <GroupsRoundedIcon fontSize="large" />,
  networking: <HubRoundedIcon fontSize="large" />,
};

// Tres tarjetas de igual ancho y jerarquía, sin modo destacado ni CTA por
// tarjeta. En md pasan a tres columnas equivalentes.
export function Modes() {
  return (
    <Box
      component="section"
      id="modos"
      aria-labelledby="modos-title"
      sx={{ py: { xs: 6, md: 9 }, scrollMarginTop: 80 }}
    >
      <Container maxWidth="lg">
        <Typography id="modos-title" component="h2" variant="h2" sx={{ mb: 1.5 }}>
          Tres modos, un mismo lugar
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 4, maxWidth: 640 }}>
          Elige cómo quieres conectar. Los tres recorridos tienen la misma
          importancia.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {MODES.map((mode) => (
            <Card key={mode.id} variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Box aria-hidden sx={{ color: "info.main" }}>
                    {ICONS[mode.id]}
                  </Box>
                  <Typography component="h3" variant="h3">
                    {mode.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: "text.secondary" }}>
                    {mode.description}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
