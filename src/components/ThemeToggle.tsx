import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import { IconButton, Tooltip, useTheme } from "@mui/material";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";

export const ThemeToggle = ({
  onThemeChange,
}: {
  onThemeChange: (mode: "light" | "dark") => void;
}) => {
  const theme = useTheme();
  const { t } = useTranslation();
  const [mode, setMode] = useState<"light" | "dark">(theme.palette.mode);

  useEffect(() => {
    // Charger la préférence sauvegardée ou utiliser la préférence système
    const savedMode = localStorage.getItem("theme-mode");
    if (savedMode === "light" || savedMode === "dark") {
      setMode(savedMode);
      onThemeChange(savedMode);
    } else if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      setMode("dark");
      onThemeChange("dark");
    }
  }, [onThemeChange]);

  const toggleTheme = () => {
    const newMode = mode === "light" ? "dark" : "light";
    setMode(newMode);
    localStorage.setItem("theme-mode", newMode);
    onThemeChange(newMode);
  };

  return (
    <Tooltip title={t(mode === "light" ? "switchToDark" : "switchToLight")}>
      <IconButton onClick={toggleTheme} color="inherit">
        {mode === "light" ? <Brightness4Icon /> : <Brightness7Icon />}
      </IconButton>
    </Tooltip>
  );
};
