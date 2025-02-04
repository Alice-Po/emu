import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { GlobalStyles } from '@mui/material';

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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <GlobalStyles styles={globalStyles} />
    <App />
  </React.StrictMode>,
);
