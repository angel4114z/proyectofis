"use client";

import { createTheme } from "@mui/material/styles";

// Familia tipográfica única con fallback de sistema.
// Inter solo se aplicaría si estuviera disponible localmente; aquí se
// mantiene como primera opción con una pila de sistema robusta que no
// compromete el build al no requerir descarga en tiempo de compilación.
const fontFamily = [
  "Inter",
  "-apple-system",
  "BlinkMacSystemFont",
  '"Segoe UI"',
  "Roboto",
  '"Helvetica Neue"',
  "Arial",
  "sans-serif",
].join(", ");

// Tokens exactos de la propuesta (docs/landing-fase-1.md).
const lightTokens = {
  background: "#F7F8FC",
  surface: "#FFFFFF",
  textPrimary: "#171B2C",
  textSecondary: "#4B536B",
  action: "#851D35",
  actionText: "#FFFFFF",
  link: "#3748B8",
  accent: "#F0B94D",
  accentText: "#171B2C",
};

const darkTokens = {
  background: "#171B2C",
  surface: "#222840",
  textPrimary: "#F7F8FC",
  textSecondary: "#BCC4D9",
  action: "#FFB7C6",
  actionText: "#171B2C",
  link: "#B9C4FF",
  accent: "#F0B94D",
  accentText: "#171B2C",
};

export const theme = createTheme({
  cssVariables: {
    // Alterna esquemas por clase en <html>, alineado con
    // InitColorSchemeScript(attribute="class") y useColorScheme().
    colorSchemeSelector: "class",
  },

  colorSchemes: {
    light: {
      palette: {
        mode: "light",
        primary: {
          main: lightTokens.action,
          contrastText: lightTokens.actionText,
        },
        secondary: {
          main: lightTokens.accent,
          contrastText: lightTokens.accentText,
        },
        info: {
          main: lightTokens.link,
          contrastText: lightTokens.surface,
        },
        background: {
          default: lightTokens.background,
          paper: lightTokens.surface,
        },
        text: {
          primary: lightTokens.textPrimary,
          secondary: lightTokens.textSecondary,
        },
        divider: "rgba(23, 27, 44, 0.12)",
      },
    },
    dark: {
      palette: {
        mode: "dark",
        primary: {
          main: darkTokens.action,
          contrastText: darkTokens.actionText,
        },
        secondary: {
          main: darkTokens.accent,
          contrastText: darkTokens.accentText,
        },
        info: {
          main: darkTokens.link,
          contrastText: darkTokens.background,
        },
        background: {
          default: darkTokens.background,
          paper: darkTokens.surface,
        },
        text: {
          primary: darkTokens.textPrimary,
          secondary: darkTokens.textSecondary,
        },
        divider: "rgba(247, 248, 252, 0.4)",
      },
    },
  },

  shape: {
    borderRadius: 16,
  },

  typography: {
    fontFamily,
    // H1 fluido 36 → 68 px, interlineado ≈ 1.06.
    h1: {
      fontWeight: 700,
      fontSize: "clamp(2.25rem, 1.4rem + 3.8vw, 4.25rem)",
      lineHeight: 1.06,
      letterSpacing: "-0.015em",
    },
    h2: {
      fontWeight: 700,
      fontSize: "clamp(1.75rem, 1.3rem + 1.8vw, 2.5rem)",
      lineHeight: 1.15,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontWeight: 600,
      fontSize: "clamp(1.35rem, 1.15rem + 0.8vw, 1.75rem)",
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 600,
      fontSize: "1.25rem",
      lineHeight: 1.3,
    },
    subtitle1: {
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      // Texto base 16–18 px con interlineado 1.55.
      fontSize: "1.0625rem",
      lineHeight: 1.55,
    },
    body2: {
      fontSize: "0.9375rem",
      lineHeight: 1.55,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Anillo de foco real: 2px sólidos con separación de 2px respecto al
        // control. Usa el color de enlace/foco (info.main) que ofrece ≥3:1
        // sobre las superficies claras y oscuras. El box-shadow intermedio
        // separa el anillo del control cuando comparten color (doble anillo).
        "*:focus-visible": {
          outline: "2px solid var(--mui-palette-info-main)",
          outlineOffset: "2px",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 44,
          padding: "10px 22px",
          "&.Mui-focusVisible": {
            outline: "2px solid var(--mui-palette-info-main)",
            outlineOffset: "2px",
            // Halo que separa el anillo del fondo del botón (doble anillo).
            boxShadow: "0 0 0 2px var(--mui-palette-background-default)",
          },
        },
        sizeLarge: {
          minHeight: 48,
          padding: "12px 28px",
          fontSize: "1rem",
        },
      },
    },
    MuiLink: {
      defaultProps: {
        color: "info.main",
      },
      styleOverrides: {
        root: {
          borderRadius: 4,
          "&.Mui-focusVisible, &:focus-visible": {
            outline: "2px solid var(--mui-palette-info-main)",
            outlineOffset: "2px",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": {
            outline: "2px solid var(--mui-palette-info-main)",
            outlineOffset: "2px",
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          "&.Mui-focusVisible": {
            outline: "2px solid var(--mui-palette-info-main)",
            outlineOffset: "2px",
            boxShadow: "0 0 0 2px var(--mui-palette-background-default)",
            zIndex: 1,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          "&.Mui-focusVisible": {
            backgroundColor: "transparent",
            outline: "2px solid var(--mui-palette-info-main)",
            outlineOffset: "-2px",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          // var(--mui-palette-divider) la intercambia MUI por esquema, así el
          // borde también contrasta en oscuro. En styleOverrides (CSS plano, no
          // sx) el token "divider" no se resuelve, por eso se usa la variable
          // CSS explícita; interpolar theme.palette.divider fijaría el valor claro.
          border: "1px solid var(--mui-palette-divider)",
          backgroundImage: "none",
        },
      },
    },
  },
});
