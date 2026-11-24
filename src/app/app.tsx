import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "@/features/auth/auth-context";
import { ProtectedRoute } from "@/features/auth/protected-route";
import { AppLayout } from "@/app/app-layout";
import { LoginPage } from "@/features/auth/login-page";
import { NoAccessPage } from "@/features/auth/no-access-page";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { PlayersPage } from "@/features/players/players-page";
import { CourtsPage } from "@/features/courts/courts-page";
import { AgendaPage } from "@/features/agenda/agenda-page";
import { CatalogPage } from "@/features/catalog/catalog-page";
import { SettingsPage } from "@/features/settings/settings-page";
import { StaffPage } from "@/features/staff/staff-page";
import { ToastProvider } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/sin-acceso",
    element: <NoAccessPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "jugadores", element: <PlayersPage /> },
      { path: "canchas", element: <CourtsPage /> },
      { path: "agenda", element: <AgendaPage /> },
      { path: "catalogo", element: <CatalogPage /> },
      { path: "configuracion", element: <SettingsPage /> },
      { path: "personal", element: <StaffPage /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
      <Toaster />
    </ToastProvider>
  );
}
