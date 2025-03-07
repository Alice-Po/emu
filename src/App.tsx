import { CssBaseline, ThemeProvider } from "@mui/material";
import { useState } from "react";
import ImageOptimizer from "./components/ImageOptimizer";
import "./i18n";
import { createAppTheme } from "./theme";

export const App = () => {
  const [mode, setMode] = useState<"light" | "dark">(() => {
    const savedMode = localStorage.getItem("theme-mode");
    if (savedMode === "light" || savedMode === "dark") {
      return savedMode;
    }
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }
    return "light";
  });

  const theme = createAppTheme(mode);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <ImageOptimizer onThemeChange={setMode} />
    </ThemeProvider>
  );
};
