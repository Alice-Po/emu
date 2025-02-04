import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router";
import { createHashRouter } from "react-router-dom";
import { App } from "./App";
import { ThemeProvider, CssBaseline, StyledEngineProvider } from '@mui/material';
import { GlobalStyles } from '@mui/material';
import theme from './theme';

// Force dark mode in the browser
document.documentElement.style.colorScheme = 'dark';
document.body.style.backgroundColor = '#121212';
document.body.style.color = '#ffffff';

const globalStyles = {
  '*': {
    margin: 0,
    padding: 0,
    boxSizing: 'border-box',
  },
  'html, body': {
    minHeight: '100vh',
    backgroundColor: '#121212',
    color: '#ffffff',
  },
  '#root': {
    minHeight: '100vh',
    backgroundColor: '#121212',
  },
};

const router = createHashRouter([
  {
    path: "*",
    element: <App />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StyledEngineProvider injectFirst>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <GlobalStyles styles={globalStyles} />
        <RouterProvider router={router} />
      </ThemeProvider>
    </StyledEngineProvider>
  </React.StrictMode>,
);
