import React, { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle,
  ArrowLeft,
  Mail,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "../components/ui/Input";
import { useThemeStore } from "../store/themeStore";
import { ParticlesEffect } from "../components/effects/ParticlesEffect";
import { authService } from "../services/authService";
import { useToast } from "../hooks/useToast";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Extrair token tanto dos search params quanto do hash
  const getTokenFromUrl = () => {
    // Primeiro tentar nos search params
    let token = searchParams.get("access_token") || searchParams.get("token");

    // Se não encontrou, verificar no hash (formato do Supabase)
    if (!token) {
      const hash = window.location.hash;
      if (hash && hash.includes("access_token=")) {
        const hashParams = new URLSearchParams(hash.substring(1)); // Remove o #
        token = hashParams.get("access_token");
      }
    }

    return token || "";
  };

  const token = getTokenFromUrl();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [isExpiredError, setIsExpiredError] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [hasCheckedErrors, setHasCheckedErrors] = useState(false);
  const { theme } = useThemeStore();
  const { showToast } = useToast();

  const logoUrl =
    theme === "dark"
      ? "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png"
      : "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-DARK.png";

  // Reset error checking quando parâmetros importantes mudam
  useEffect(() => {
    setHasCheckedErrors(false);
    setError("");
    setIsExpiredError(false);
  }, [searchParams.toString(), window.location.hash]); // Resetar quando parâmetros ou hash mudarem

  useEffect(() => {
    // Só verificar uma vez para evitar loops infinitos
    if (hasCheckedErrors) return;

    // Verificar erros do Supabase na URL (tanto em search params quanto no hash)
    const checkSupabaseErrors = () => {
      // Verificar no hash primeiro (formato do Supabase: #error=...)
      const hash = window.location.hash;
      if (hash && hash.includes("error=")) {
        const hashParams = new URLSearchParams(hash.substring(1)); // Remove o #
        const error = hashParams.get("error");
        const errorCode = hashParams.get("error_code");
        const errorDescription = hashParams.get("error_description");

        if (error) {
          let message = "Erro na recuperação de senha.";
          let isExpired = false;

          if (errorCode === "otp_expired" || error === "access_denied") {
            message = "O link de recuperação expirou ou é inválido.";
            isExpired = true;
          } else if (errorDescription) {
            message = decodeURIComponent(errorDescription.replace(/\+/g, " "));
          }

          setError(message);
          setIsExpiredError(isExpired);
          showToast(message, "error");
          return true; // Retorna true se encontrou erro
        }
      }

      // Verificar também nos search params (fallback)
      const urlError = searchParams.get("error");
      const urlErrorCode = searchParams.get("error_code");
      const urlErrorDescription = searchParams.get("error_description");

      if (urlError) {
        let message = "Erro na recuperação de senha.";
        let isExpired = false;

        if (urlErrorCode === "otp_expired" || urlError === "access_denied") {
          message = "O link de recuperação expirou ou é inválido.";
          isExpired = true;
        } else if (urlErrorDescription) {
          message = decodeURIComponent(urlErrorDescription.replace(/\+/g, " "));
        }

        setError(message);
        setIsExpiredError(isExpired);
        showToast(message, "error");
        return true;
      }

      return false; // Não encontrou erro
    };

    // Verificar erros primeiro
    const hasError = checkSupabaseErrors();

    // Se não há erro mas também não há token, mostrar mensagem padrão
    if (!hasError && !token) {
      setError(
        "Token de recuperação não encontrado. Solicite uma nova recuperação de senha."
      );
    }

    // Marcar que já verificamos os erros
    setHasCheckedErrors(true);
  }, [token, searchParams, hasCheckedErrors]); // Removido showToast das dependências para evitar loops

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validações
    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    if (!token) {
      setError("Token de recuperação inválido.");
      return;
    }

    setLoading(true);

    try {
      const response = await authService.resetPassword(token, newPassword);
      setSuccess(true);
      showToast(response.message, "success");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao redefinir senha";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleShowNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

  const handleResendEmail = async () => {
    setResendLoading(true);

    // Tentar extrair email dos parâmetros da URL
    let extractedEmail = "";

    // Verificar no hash primeiro
    const hash = window.location.hash;
    if (hash && hash.includes("email=")) {
      const hashParams = new URLSearchParams(hash.substring(1));
      extractedEmail = hashParams.get("email") || "";
    }

    // Verificar nos search params como fallback
    if (!extractedEmail) {
      extractedEmail = searchParams.get("email") || "";
    }

    const email = prompt(
      "Por favor, digite seu email para receber um novo link de recuperação:",
      extractedEmail
    );

    if (!email) {
      setResendLoading(false);
      return;
    }

    try {
      const response = await authService.forgotPassword(email);
      showToast(response.message, "success");
      setError(""); // Limpar erro anterior
      setIsExpiredError(false);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao enviar novo email";
      showToast(message, "error");
    } finally {
      setResendLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <ParticlesEffect />
        <motion.div
          className="bg-white dark:bg-dark-800 p-8 rounded-lg shadow-md w-96 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 relative z-10"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="flex items-center justify-center mb-6"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
            </div>
          </motion.div>

          <motion.h2
            className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Senha redefinida!
          </motion.h2>

          <motion.p
            className="text-center text-gray-600 dark:text-gray-400 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            Sua senha foi redefinida com sucesso! Você já pode fazer login com
            sua nova senha.
          </motion.p>

          <motion.div
            className="space-y-4"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-[#7f00ff] text-white py-2 px-4 rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2 transition-colors"
            >
              Fazer Login
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Componente específico para token expirado
  if (isExpiredError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <ParticlesEffect />
        <motion.div
          className="bg-white dark:bg-dark-800 p-8 rounded-lg shadow-md w-96 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 relative z-10"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="flex items-center justify-center mb-6"
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-orange-600 dark:text-orange-400" />
            </div>
          </motion.div>

          <motion.h2
            className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white"
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
          >
            Link Expirado
          </motion.h2>

          <motion.p
            className="text-center text-gray-600 dark:text-gray-400 mb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
          >
            {error}
          </motion.p>

          <motion.div
            className="space-y-3"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <Link
              to="/login"
              className="w-full bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Login
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      <ParticlesEffect />

      <motion.div
        className="bg-white dark:bg-dark-800 p-8 rounded-lg shadow-md w-96 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90 relative z-10"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="flex items-center justify-center mb-6"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.1, duration: 0.3 }}
        >
          <img src={logoUrl} alt="Logo" className="w-24" />
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          Redefinir Senha
        </motion.h2>

        <motion.p
          className="text-center text-gray-600 dark:text-gray-400 mb-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.3 }}
        >
          Digite sua nova senha abaixo.
        </motion.p>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm"
          >
            <p className="mb-2">{error}</p>
            {isExpiredError && (
              <button
                onClick={handleResendEmail}
                disabled={resendLoading}
                className="inline-flex items-center px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {resendLoading ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    Enviando...
                  </>
                ) : (
                  "Solicitar novo link"
                )}
              </button>
            )}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                label="Nova Senha"
                placeholder="No mínimo 6 caracteres"
                required
              />
              <button
                type="button"
                onClick={toggleShowNewPassword}
                className="absolute right-3 top-[47px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: -10, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
          >
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                label="Confirmar Nova Senha"
                placeholder="Digite a senha novamente"
                required
              />
              <button
                type="button"
                onClick={toggleShowConfirmPassword}
                className="absolute right-3 top-[47px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </motion.div>

          <motion.div
            className="space-y-3"
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.3 }}
          >
            <button
              type="submit"
              disabled={loading || !token}
              className="w-full bg-[#7f00ff] text-white py-2 px-4 rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Redefinindo...
                </span>
              ) : (
                "Redefinir Senha"
              )}
            </button>

            <Link
              to="/login"
              className="w-full bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Login
            </Link>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}
