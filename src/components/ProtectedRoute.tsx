import React, { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

export function ProtectedRoute() {
  const { isAuthenticated, user, token, logout } = useAuthStore();

  useEffect(() => {
    // Validar dados de autenticação ao montar o componente
    if (!authService.validateAuthData()) {
      logout();
    }
  }, [logout]);

  // Verificar se está realmente autenticado
  const isReallyAuthenticated = isAuthenticated && user && token && authService.getStoredToken();

  if (!isReallyAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
} 