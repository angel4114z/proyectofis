import {
  Box,
  Card,
  CardContent,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";

import { TRUST_MESSAGES } from "../content";

const ICONS = [
  <SchoolRoundedIcon key="0" fontSize="large" />,
  <LockRoundedIcon key="1" fontSize="large" />,
  <ForumRoundedIcon key="2" fontSize="large" />,
];

// Comunidad, privacidad y seguridad: tres mensajes concretos, sin insignias
// de verificación universitaria ni promesas de moderación inexistentes.
export function Community() {
  return (
    <Box
      component="section"
      id="comunidad"
      aria-labelledby="comunidad-title"
      sx={{ py: { xs: 6, md: 9 }, scrollMarginTop: 80 }}
    >
      <Container maxWidth="lg">
        <Typography id="comunidad-title" component="h2" variant="h2" sx={{ mb: 1.5 }}>
          Comunidad, privacidad y seguridad
        </Typography>
        <Typography variant="body1" sx={{ color: "text.secondary", mb: 4, maxWidth: 680 }}>
          Reglas del producto previsto, descritas con claridad sobre su
          disponibilidad.
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
            gap: 3,
          }}
        >
          {TRUST_MESSAGES.map((message, index) => (
            <Card key={message.title} variant="outlined" sx={{ height: "100%" }}>
              <CardContent sx={{ p: 3 }}>
                <Stack spacing={1.5}>
                  <Box aria-hidden sx={{ color: "info.main" }}>
                    {ICONS[index]}
                  </Box>
                  <Typography component="h3" variant="h4">
                    {message.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {message.description}
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
