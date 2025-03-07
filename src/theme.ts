import { createTheme, ThemeOptions } from "@mui/material/styles";

const getThemeOptions = (mode: "light" | "dark"): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: mode === "light" ? "#2E7D32" : "#9DFF20",
      contrastText: mode === "light" ? "#FFFFFF" : "#000000",
    },
    background: {
      default: mode === "light" ? "#FFFFFF" : "#121212",
      paper: mode === "light" ? "#F5F5F5" : "#1E1E1E",
    },
    text: {
      primary: mode === "light" ? "#000000" : "#FFFFFF",
      secondary:
        mode === "light" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)",
    },
    divider:
      mode === "light" ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.12)",
    action: {
      active: mode === "light" ? "#000000" : "#FFFFFF",
      hover:
        mode === "light" ? "rgba(0, 0, 0, 0.08)" : "rgba(255, 255, 255, 0.08)",
      selected:
        mode === "light" ? "rgba(0, 0, 0, 0.16)" : "rgba(255, 255, 255, 0.16)",
      disabled:
        mode === "light" ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.3)",
      disabledBackground:
        mode === "light" ? "rgba(0, 0, 0, 0.12)" : "rgba(255, 255, 255, 0.12)",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        "html, body": {
          backgroundColor: mode === "light" ? "#FFFFFF" : "#121212",
          color: mode === "light" ? "#000000" : "#FFFFFF",
          minHeight: "100vh",
          margin: 0,
          padding: 0,
        },
        "*": {
          boxSizing: "border-box",
        },
        "#root": {
          backgroundColor: mode === "light" ? "#FFFFFF" : "#121212",
          minHeight: "100vh",
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: mode === "light" ? "#F5F5F5" : "#1E1E1E",
          color: mode === "light" ? "#000000" : "#FFFFFF",
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          backgroundColor: mode === "light" ? "#F5F5F5" : "#1E1E1E",
          color: mode === "light" ? "#000000" : "#FFFFFF",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: mode === "light" ? "#F5F5F5" : "#1E1E1E",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: "inherit",
        },
        contained: {
          color: mode === "light" ? "#FFFFFF" : "#000000",
          backgroundColor: mode === "light" ? "#2E7D32" : "#9DFF20",
          "&:hover": {
            backgroundColor: mode === "light" ? "#1B5E20" : "#7FCC19",
          },
        },
        outlined: {
          borderColor: mode === "light" ? "#2E7D32" : "#9DFF20",
          color: mode === "light" ? "#2E7D32" : "#9DFF20",
          "&:hover": {
            borderColor: mode === "light" ? "#1B5E20" : "#7FCC19",
            backgroundColor:
              mode === "light"
                ? "rgba(46, 125, 50, 0.08)"
                : "rgba(157, 255, 32, 0.08)",
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          "& .MuiSwitch-track": {
            backgroundColor: mode === "light" ? "#CCCCCC" : "#333333",
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          "&.localProcessing": {
            color: mode === "light" ? "#2E7D32" : "#B4FF52",
            fontWeight: 500,
          },
        },
      },
    },
  },
});

export const createAppTheme = (mode: "light" | "dark") =>
  createTheme(getThemeOptions(mode));

// Export a default theme (will be overridden by the ThemeProvider)
export default createAppTheme("light");
