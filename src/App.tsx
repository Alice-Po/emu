import { ThemeProvider } from "@mui/material";
import { createTheme, ThemeOptions } from "@mui/material/styles";
import ImageOptimizer from "./components/ImageOptimizer";
import { CssBaseline } from "@mui/material";
import "./i18n";

// Configuration du thème sombre
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#9DFF20",
    },
    background: {
      default: "#121212",
      paper: "#1E1E1E",
    },
    text: {
      primary: "#ffffff",
      secondary: "rgba(255, 255, 255, 0.7)",
    },
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          display: "none",
        },
      },
    },
  },
});

// Application simplifiée sans react-admin
export const App = () => (
  <ThemeProvider theme={darkTheme}>
    <CssBaseline />
    <ImageOptimizer />
  </ThemeProvider>
);
