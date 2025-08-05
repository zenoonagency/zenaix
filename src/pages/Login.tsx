import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "../components/ui/Input";
import { useThemeStore } from "../store/themeStore";
import { ParticlesEffect } from "../components/effects/ParticlesEffect";
import { useToast } from "../hooks/useToast";
import { OAuthButtons } from "../components/auth/OAuthButtons";
import { supabase } from "../lib/supabaseClient";
import { handleSupabaseError } from "../utils/supabaseErrorTranslator";
import { userService } from "../services/user/user.service";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { isAuthenticated, _hasHydrated } = useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    _hasHydrated: state._hasHydrated,
  }));

  useEffect(() => {
    if (_hasHydrated && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [_hasHydrated, isAuthenticated, navigate]);

  if (!_hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
        <span className="text-gray-700 dark:text-gray-200 text-lg">
          Carregando...
        </span>
      </div>
    );
  }

  const logoUrl =
    theme === "dark"
      ? "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png"
      : "/assets/images/LOGO-DARK.webp";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Fazer login com Supabase para obter a sessão/token
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError || !data.session) {
        throw signInError || new Error("Sessão não encontrada após o login.");
      }

      const token = data.session.access_token;
      const meData = await userService.getMe(token);

      const { updateUserDataSilently } = useAuthStore.getState();
      updateUserDataSilently(meData);

      navigate("/dashboard", { replace: true });
    } catch (error: any) {
      await supabase.auth.signOut();
      const { clearAuth } = useAuthStore.getState();
      clearAuth();

      const message = handleSupabaseError(error, "Erro ao fazer login");
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  // O resto do seu componente JSX permanece o mesmo...
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <ParticlesEffect />
      <motion.div
        className="bg-white dark:bg-dark-800 p-8 rounded-lg shadow-md w-96 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 relative z-10"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center mb-6">
          <img src={logoUrl} alt="Login" className="w-24" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Seja bem-vindo!
        </h2>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              label="Email"
              required
            />
          </div>
          <div>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                label="Senha"
                required
              />
              <button
                type="button"
                onClick={toggleShowPassword}
                className="absolute right-3 top-[47px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#7f00ff] text-white py-2 px-4 rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Carregando...
                </span>
              ) : (
                "Entrar"
              )}
            </button>
          </div>
        </form>

        <OAuthButtons className="mt-6" />

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Não tem uma conta?{" "}
          <Link
            to="/register"
            className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
          >
            Cadastre-se
          </Link>
        </div>
        <div className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          <Link
            to="/forgot-password"
            className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
          >
            Esqueceu sua senha?
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
