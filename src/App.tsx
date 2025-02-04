import {
  Admin,
  Resource,
  ListGuesser,
  EditGuesser,
  ShowGuesser,
  CustomRoutes,
} from "react-admin";
import { Layout } from "./Layout";
import { Route } from "react-router-dom";
import ImageOptimizer from "./components/ImageOptimizer";
import { defaultTheme } from 'react-admin';
import { ThemeOptions } from '@mui/material';

// Fusion du thème react-admin avec notre thème sombre
const darkTheme: ThemeOptions = {
  ...defaultTheme,
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
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#1E1E1E',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#121212',
        },
      },
    },
  },
};

export const App = () => (
  <Admin layout={Layout} theme={darkTheme}>
    <CustomRoutes>
      <Route path="/optimize" element={<ImageOptimizer />} />
    </CustomRoutes>
    <Resource
      name="Image"
      list={ListGuesser}
      edit={EditGuesser}
      show={ShowGuesser}
    />
  </Admin>
);
