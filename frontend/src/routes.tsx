import { createBrowserRouter } from "react-router";
import { HeroPage } from "./components/HeroPage";
import { SetupDashboard } from "./components/SetupDashboard";
import { RoleSelection } from "./components/RoleSelection";
import { AnalyticsDashboard } from "./components/AnalyticsDashboard";
import { DashboardDemo } from "./components/DashboardDemo";
import { TechnicalInterviewLayout } from "./components/TechnicalInterview/TechnicalInterviewLayout";
import { VapiInterviewPanel } from "./components/VapiInterviewPanel";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { SignupPage } from "./pages/SignupPage";
import { InterviewsPage } from "./pages/InterviewsPage";
import { InterviewReplayPage } from "./pages/InterviewReplayPage";

export const router = createBrowserRouter([
  // Public routes
  {
    path: "/login",
    Component: LoginPage,
  },
  {
    path: "/signup",
    Component: SignupPage,
  },
  // Protected routes
  {
    path: "/",
    element: <ProtectedRoute><HeroPage /></ProtectedRoute>,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><DashboardDemo /></ProtectedRoute>,
  },
  {
    path: "/roles",
    element: <ProtectedRoute><RoleSelection /></ProtectedRoute>,
  },
  {
    path: "/setup",
    element: <ProtectedRoute><SetupDashboard /></ProtectedRoute>,
  },
  {
    path: "/interview/voice",
    element: <ProtectedRoute><VapiInterviewPanel /></ProtectedRoute>,
  },
  {
    path: "/technical-interview",
    element: <ProtectedRoute><TechnicalInterviewLayout /></ProtectedRoute>,
  },
  {
    path: "/analytics",
    element: <ProtectedRoute><AnalyticsDashboard /></ProtectedRoute>,
  },
  {
    path: "/interviews",
    element: <ProtectedRoute><InterviewsPage /></ProtectedRoute>,
  },
  {
    path: "/interviews/:id",
    element: <ProtectedRoute><InterviewReplayPage /></ProtectedRoute>,
  },
  // /replay — current interview from router state (no ID needed)
  {
    path: "/replay",
    element: <ProtectedRoute><InterviewReplayPage /></ProtectedRoute>,
  },
]);
