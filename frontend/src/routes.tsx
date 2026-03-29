import { createBrowserRouter } from "react-router";
import { HeroPage } from "./components/HeroPage";
import { SetupDashboard } from "./components/SetupDashboard";
import { RoleSelection } from "./components/RoleSelection";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { DashboardDemo } from "./components/DashboardDemo";
import { TechnicalInterviewLayout } from "./components/TechnicalInterview/TechnicalInterviewLayout";
import { VapiInterviewPanel } from "./components/VapiInterviewPanel";

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
    path: "/interview/voice",
    Component: VapiInterviewPanel,
  },
  {
    path: "/technical-interview",
    Component: TechnicalInterviewLayout,
  },
  {
    path: "/analytics",
    Component: AnalyticsDashboard,
  },
]);
