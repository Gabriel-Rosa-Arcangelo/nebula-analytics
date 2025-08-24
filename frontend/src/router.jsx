import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./ui/AppLayout";
import Dashboard from "./pages/Dashboard";
import Reports from "./pages/Reports";
import DataSources from "./pages/DataSources";
import Settings from "./pages/Settings";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "reports", element: <Reports /> },
      { path: "data-sources", element: <DataSources /> },
      { path: "settings", element: <Settings /> },
    ],
  },
]);
