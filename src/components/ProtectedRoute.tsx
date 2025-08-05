import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

function LogoutLoader() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Saindo...</p>
      </div>
    </div>
  );
}

export function ProtectedRoute() {
  const { isAuthenticated, _hasHydrated, isLoggingOut } = useAuthStore();

  if (isLoggingOut && isLoggingOut()) {
    return null;
  }

  // Só bloqueia se já hidratou e não está autenticado
  if (_hasHydrated && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Enquanto não hidratou, renderiza null
  if (!_hasHydrated) {
    return null;
  }

  return <Outlet />;
}
