import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  BrainCircuit,
  Sun,
  Moon,
  User,
  ChevronDown,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useTheme } from "../../hooks/useTheme";
import { useAuthStore } from "../../store/authStore";

export function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, organization, token, updateUser, logout, isAuthenticated } =
    useAuthStore();

  const handleLogout = () => {
    try {
      setIsDropdownOpen(false);
      logout();
    } catch (error) {
      console.error("Erro no logout:", error);
      localStorage.clear();
      window.location.href = "/login";
    }
  };

  // Snake_case: destructuring já está correto pois os nomes dos stores refletem os tipos
  // Conferir todos os usos abaixo
  const planName = user?.organization?.plan?.name || "Plano Básico";

  return (
    <header className="px-4 py-2 flex items-center justify-between relative bg-transparent">
      <div className="flex items-center gap-4">
        <button
          onClick={() => window.open("/pergunte-ia", "_blank")}
          className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-900 dark:text-white hover:bg-[#7f00ff]/10 rounded-lg transition-colors bg-white dark:bg-dark-700"
        >
          <img
            src="https://zenaix.com.br/wp-content/uploads/2025/03/pergunte-a-IA.webp"
            alt="IA"
            className="w-5 h-5 mr-1"
          />
          Pergunte à IA
        </button>

        <button
          onClick={toggleTheme}
          className="p-2 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          title={
            theme === "dark"
              ? "Mudar para tema claro"
              : "Mudar para tema escuro"
          }
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Botão de Logout Temporário */}
        <button
          onClick={handleLogout}
          className="px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          Sair
        </button>

        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-3 py-1.5 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-800 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              {/* Snake_case: avatar_url */}
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover border-2 border-[#7f00ff]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#7f00ff]/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-[#7f00ff]" />
                </div>
              )}
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium">
                  {user?.name || "Usuário"}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {planName}
                </span>
              </div>
            </div>
            <ChevronDown className="w-4 h-4 ml-2" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-lg shadow-lg py-1 z-50">
              <Link
                to="/dashboard/profile"
                className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                Perfil
              </Link>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700"
              >
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
