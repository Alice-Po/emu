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

export const App = () => (
  <Admin layout={Layout}>
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
