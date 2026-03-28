import { createBrowserRouter } from "react-router";
import { HeroPage } from "./components/HeroPage";
import { SetupDashboard } from "./components/SetupDashboard";
import { RoleSelection } from "./components/RoleSelection";
import { LiveInterview } from "./components/LiveInterview";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { DashboardDemo } from "./components/DashboardDemo";
import { TechnicalInterviewLayout } from "./components/TechnicalInterview/TechnicalInterviewLayout";
import { VapiInterviewPanel } from "./components/VapiInterviewPanel";
import { VapiTest } from "./components/VapiTest";

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
    // Behavioral interview (unchanged)
    path: "/interview",
    Component: LiveInterview,
  },
  {
    path: "/interview/voice",
    Component: VapiInterviewPanel,
  },
  {
    // Technical + Hybrid interview
    path: "/technical-interview",
    Component: TechnicalInterviewLayout,
  },
  {
    path: "/vapi-test",
    Component: VapiTest,
  },
  {
    path: "/analytics",
    Component: AnalyticsDashboard,
  },
]);
