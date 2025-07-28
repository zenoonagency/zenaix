import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "../components/ui/Input";
import { useThemeStore } from "../store/themeStore";
import { ParticlesEffect } from "../components/effects/ParticlesEffect";
import { useToast } from "../hooks/useToast";
import { inviteService } from "../services/invite/invite.service";
import { OAuthButtonsInvite } from "../components/auth/OAuthButtonsInvite";
import { supabase } from "../lib/supabaseClient";
import { handleSupabaseError } from "../utils/supabaseErrorTranslator";

export function AcceptInviteLogin() {
  const [searchParams] = useSearchParams();
  const org = searchParams.get("org");
  const inviteToken = searchParams.get("token");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const { showToast } = useToast();



  const logoUrl =
    theme === "dark"
      ? "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png"
      : "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-DARK.png";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      // Chama a service de aceitar convite
      const { data: { session } } = await supabase.auth.getSession();
      if (session && inviteToken) {
        await inviteService.acceptInvite(session.access_token, { token: inviteToken });
      }

      showToast("Convite aceito com sucesso!", "success");
      navigate("/dashboard");
    } catch (error: any) {
      const message = handleSupabaseError(error, "Erro ao fazer login");
      if (
        message.includes("Convite não pode ser aceito. Status atual: ACCEPTED.")
      ) {
        setError(
          "Este convite já foi aceito anteriormente. Faça login normalmente."
        );
        showToast(
          "Este convite já foi aceito anteriormente. Faça login normalmente.",
          "info"
        );
      } else {
        setError(message);
        showToast(message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleShowPassword = () => setShowPassword(!showPassword);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <ParticlesEffect />
      <motion.div
        className="bg-white dark:bg-dark-800 p-8 rounded-lg shadow-md w-96 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 relative z-10"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center justify-center mb-2">
          <img src={logoUrl} alt="Login" className="w-24" />
        </div>
        {org && (
          <div className="my-4 text-center text-4xl font-bold text-purple-700">
            {org}
          </div>
        )}
        <h2 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
          Acesse sua conta para aceitar o convite
        </h2>
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email"
            required
          />
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
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#7f00ff] text-white py-2 px-4 rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Autenticando...
              </span>
            ) : (
              "Entrar e aceitar convite"
            )}
          </button>
        </form>

        <OAuthButtonsInvite
          className="mt-6"
          org={org}
          inviteToken={inviteToken}
        />

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Não tem uma conta?{" "}
          <Link
            to={`/accept-invite-register?org=${encodeURIComponent(
              org || ""
            )}&token=${encodeURIComponent(inviteToken || "")}`}
            className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
          >
            Cadastre-se
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
