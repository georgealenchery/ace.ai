import { createBrowserRouter } from "react-router";
import { HeroPage } from "./components/HeroPage";
import { SetupDashboard } from "./components/SetupDashboard";
import { RoleSelection } from "./components/RoleSelection";
import { LiveInterview } from "./components/LiveInterview";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { DashboardDemo } from "./components/DashboardDemo";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: HeroPage,
  },
  {
    path: "/dashboard",
    Component: DashboardDemo,
  },
  {
    path: "/roles",
    Component: RoleSelection,
  },
  {
    path: "/setup",
    Component: SetupDashboard,
  },
  {
    path: "/interview",
    Component: LiveInterview,
  },
  {
    path: "/analytics",
    Component: AnalyticsDashboard,
  },
]);
