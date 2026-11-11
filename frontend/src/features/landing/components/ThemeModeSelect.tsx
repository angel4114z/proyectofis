"use client";

import { useColorScheme } from "@mui/material/styles";
import {
  Box,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import LightModeRoundedIcon from "@mui/icons-material/LightModeRounded";
import DarkModeRoundedIcon from "@mui/icons-material/DarkModeRounded";
import SettingsBrightnessRoundedIcon from "@mui/icons-material/SettingsBrightnessRounded";

type Mode = "light" | "dark" | "system";

const OPTIONS: ReadonlyArray<{
  value: Mode;
  label: string;
  icon: React.ReactNode;
}> = [
  { value: "light", label: "Claro", icon: <LightModeRoundedIcon fontSize="small" /> },
  { value: "dark", label: "Oscuro", icon: <DarkModeRoundedIcon fontSize="small" /> },
  {
    value: "system",
    label: "Automático",
    icon: <SettingsBrightnessRoundedIcon fontSize="small" />,
  },
];

// Selector de apariencia. useColorScheme() + persistencia de MUI es la única
// fuente de preferencia. Mientras `mode` es indefinido (antes de hidratar)
// se renderiza un hueco neutral del mismo tamaño para evitar saltos y flash.
export function ThemeModeSelect() {
  const { mode, setMode } = useColorScheme();

  if (!mode) {
    return (
      <Box
        aria-hidden
        sx={{ width: 132, height: 40, borderRadius: 2 }}
      />
    );
  }

  return (
    <ToggleButtonGroup
      size="small"
      value={mode}
      exclusive
      aria-label="Apariencia"
      onChange={(_event, next: Mode | null) => {
        if (next) setMode(next);
      }}
      sx={{
        "& .MuiToggleButton-root": {
          minWidth: 44,
          minHeight: 40,
          px: 1,
          border: "1px solid",
          borderColor: "divider",
        },
      }}
    >
      {OPTIONS.map((option) => (
        <ToggleButton
          key={option.value}
          value={option.value}
          aria-label={option.label}
        >
          <Tooltip title={option.label}>
            <Box sx={{ display: "flex", alignItems: "center" }}>
              {option.icon}
            </Box>
          </Tooltip>
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );
}
