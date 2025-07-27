import { createBrowserRouter, Navigate } from "react-router-dom";
import { DashboardLayout } from "../components/layout/DashboardLayout";
import { Dashboard } from "../pages/Dashboard";
import { Financial } from "../pages/Financial";
import { Conversations } from "../pages/Conversations";
import { Clients } from "../pages/Clients";
import { Contacts } from "../pages/Contacts";
import { Contracts } from "../pages/Contracts";
import { Messaging } from "../pages/Messaging";
import { Team } from "../pages/Team";
import { Plans } from "../pages/Plans";
import { Calendar } from "../pages/Calendar";
import { EmbedPages } from "../pages/EmbedPages";
import { Settings } from "../pages/Settings";
import { DataTables } from "../pages/DataTables";
import { Help } from "../pages/Help";
import { Tags } from "../pages/Tags";
import { Connections } from "../pages/Connections";
import { Login } from "../pages/Login";
import { Register } from "../pages/Register";
import { ForgotPassword } from "../pages/ForgotPassword";
import { ResetPassword } from "../pages/ResetPassword";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { OrganizationProtectedRoute } from "../components/OrganizationProtectedRoute";
import { PageTransition } from "../components/PageTransition";
import { AcceptInviteLogin } from "../pages/AcceptInviteLogin";
import { AcceptInviteRegister } from "../pages/AcceptInviteRegister";
import { OAuthCallback } from "../pages/OAuthCallback";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/accept-invite",
    element: <AcceptInviteLogin />,
  },
  {
    path: "/accept-invite-register",
    element: <AcceptInviteRegister />,
  },
  {
    path: "/oauth/callback",
    element: <OAuthCallback />,
  },
  {
    path: "/",
    element: <ProtectedRoute />,
    children: [
      {
        path: "",
        element: <DashboardLayout />,
        children: [
          {
            path: "",
            element: <Navigate to="/dashboard" replace />,
          },
          {
            path: "dashboard",
            children: [
              {
                path: "",
                element: (
                  <PageTransition>
                    <Dashboard />
                  </PageTransition>
                ),
              },
              {
                path: "conversations",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Conversations />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "clients",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Clients />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "contacts",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Contacts />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "financial",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Financial />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "contracts",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Contracts />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "messaging",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Messaging />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "team",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Team />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "calendar",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Calendar />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "embed-pages",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <EmbedPages />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "connections",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Connections />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "plans",
                element: (
                  <PageTransition>
                    <Plans />
                  </PageTransition>
                ),
              },
              {
                path: "settings",
                element: (
                  <PageTransition>
                    <Settings />
                  </PageTransition>
                ),
              },
              {
                path: "data-tables",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <DataTables />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
              {
                path: "help",
                element: (
                  <PageTransition>
                    <Help />
                  </PageTransition>
                ),
              },
              {
                path: "tags",
                element: (
                  <OrganizationProtectedRoute>
                    <PageTransition>
                      <Tags />
                    </PageTransition>
                  </OrganizationProtectedRoute>
                ),
              },
            ],
          },
          {
            path: "*",
            element: <Navigate to="/dashboard" replace />,
          },
        ],
      },
    ],
  },
]);
