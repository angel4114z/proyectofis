"use client";

import { useRef, useState } from "react";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Link as MuiLink,
  List,
  ListItem,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import NextLink from "@/components/ui/NextLink";
import { NAV_ANCHORS } from "../content";
import { ThemeModeSelect } from "./ThemeModeSelect";

// Isla cliente: navegación con menú compacto en móvil, selector de tema y
// accesos de autenticación hacia rutas informativas.
//
// La división escritorio/móvil se resuelve solo con CSS (display por
// breakpoint), no con useMediaQuery. Así el markup del servidor y el primer
// render del cliente son idénticos y se evita el desajuste de hidratación
// (React #418); el responsive se conserva íntegro vía los breakpoints de MUI.
export function Navbar() {
  const [open, setOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    setOpen(false);
    // Devuelve el foco al botón que abrió el menú.
    menuButtonRef.current?.focus();
  };

  const brand = (
    <Typography
      component={NextLink}
      href="/"
      variant="h4"
      sx={{
        fontWeight: 700,
        letterSpacing: "-0.01em",
        color: "text.primary",
        textDecoration: "none",
      }}
    >
      TinderUD
    </Typography>
  );

  return (
    <AppBar
      component="header"
      position="sticky"
      color="default"
      elevation={0}
      sx={{
        bgcolor: "background.default",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2, minHeight: 64 }}>
          {brand}

          {/* Rama escritorio: visible desde md. */}
          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              flexGrow: 1,
              alignItems: "center",
            }}
          >
            <Box
              component="nav"
              aria-label="Secciones"
              sx={{ ml: 3, flexGrow: 1 }}
            >
              <Stack
                direction="row"
                spacing={2.5}
                component="ul"
                sx={listReset}
              >
                {NAV_ANCHORS.map((anchor) => (
                  <li key={anchor.id}>
                    <MuiLink
                      href={anchor.href}
                      color="text.primary"
                      underline="hover"
                      sx={{ fontWeight: 600 }}
                    >
                      {anchor.label}
                    </MuiLink>
                  </li>
                ))}
              </Stack>
            </Box>

            <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
              <ThemeModeSelect />
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-end",
                }}
              >
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Button
                    component={NextLink}
                    href="/login"
                    prefetch={false}
                    variant="text"
                    color="primary"
                    aria-describedby="nav-login-notice"
                  >
                    Iniciar sesión
                  </Button>
                  <Button
                    component={NextLink}
                    href="/register"
                    prefetch={false}
                    variant="contained"
                    color="primary"
                    aria-describedby="nav-register-notice"
                  >
                    Crear cuenta
                  </Button>
                </Stack>
                <Box
                  component="span"
                  sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.25 }}
                >
                  <Box component="span" id="nav-login-notice" sx={{ mr: 1 }}>
                    Acceso en preparación
                  </Box>
                  <Box component="span" id="nav-register-notice">
                    · Registro en preparación
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>

          {/* Rama móvil: visible por debajo de md. */}
          <Stack
            direction="row"
            spacing={1}
            sx={{
              display: { xs: "flex", md: "none" },
              alignItems: "center",
              ml: "auto",
            }}
          >
            <ThemeModeSelect />
            <IconButton
              ref={menuButtonRef}
              onClick={() => setOpen(true)}
              aria-label="Abrir menú"
              aria-haspopup="dialog"
              aria-expanded={open}
              sx={{ width: 44, height: 44 }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </Container>

      <Drawer
        anchor="right"
        open={open}
        onClose={closeMenu}
        aria-label="Menú de navegación"
        slotProps={{ paper: { sx: { width: "min(88vw, 320px)", p: 2 } } }}
      >
        <Stack
          direction="row"
          sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}
        >
          {brand}
          <IconButton
            onClick={closeMenu}
            aria-label="Cerrar menú"
            sx={{ width: 44, height: 44 }}
          >
            <CloseRoundedIcon />
          </IconButton>
        </Stack>

        <Divider sx={{ mb: 1 }} />

        <Box component="nav" aria-label="Secciones">
          <List disablePadding>
            {NAV_ANCHORS.map((anchor) => (
              <ListItem key={anchor.id} disableGutters sx={{ py: 0.25 }}>
                <MuiLink
                  href={anchor.href}
                  onClick={closeMenu}
                  color="text.primary"
                  underline="hover"
                  sx={{
                    display: "block",
                    width: "100%",
                    py: 1.25,
                    fontWeight: 600,
                  }}
                >
                  {anchor.label}
                </MuiLink>
              </ListItem>
            ))}
          </List>
        </Box>

        <Divider sx={{ my: 1 }} />

        <Stack spacing={1.5}>
          <Box>
            <Button
              component={NextLink}
              href="/login"
              prefetch={false}
              onClick={closeMenu}
              variant="outlined"
              color="primary"
              fullWidth
              aria-describedby="nav-mobile-login-notice"
            >
              Iniciar sesión
            </Button>
            <Box
              id="nav-mobile-login-notice"
              component="span"
              sx={{ display: "block", mt: 0.5, fontSize: "0.75rem", color: "text.secondary" }}
            >
              Acceso en preparación
            </Box>
          </Box>
          <Box>
            <Button
              component={NextLink}
              href="/register"
              prefetch={false}
              onClick={closeMenu}
              variant="contained"
              color="primary"
              fullWidth
              aria-describedby="nav-mobile-register-notice"
            >
              Crear cuenta
            </Button>
            <Box
              id="nav-mobile-register-notice"
              component="span"
              sx={{ display: "block", mt: 0.5, fontSize: "0.75rem", color: "text.secondary" }}
            >
              Registro en preparación
            </Box>
          </Box>
        </Stack>
      </Drawer>
    </AppBar>
  );
}

const listReset = {
  listStyle: "none",
  m: 0,
  p: 0,
  display: "flex",
  alignItems: "center",
} as const;
