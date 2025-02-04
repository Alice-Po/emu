import { createTheme, ThemeOptions } from '@mui/material/styles';

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'dark',
    primary: {
      main: '#9DFF20',
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
    divider: 'rgba(255, 255, 255, 0.12)',
    action: {
      active: '#ffffff',
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(255, 255, 255, 0.16)',
      disabled: 'rgba(255, 255, 255, 0.3)',
      disabledBackground: 'rgba(255, 255, 255, 0.12)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          backgroundColor: '#121212',
          color: '#ffffff',
          minHeight: '100vh',
          margin: 0,
          padding: 0,
        },
        '*': {
          boxSizing: 'border-box',
        },
        '#root': {
          backgroundColor: '#121212',
          minHeight: '100vh',
        }
      }
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
          color: '#ffffff',
        }
      }
    },
    MuiCard: {
      defaultProps: {
        elevation: 1,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
          color: '#ffffff',
        }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          color: '#ffffff',
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            backgroundColor: '#333333',
          }
        }
      }
    }
  }
};

const theme = createTheme(themeOptions);

export default theme; 