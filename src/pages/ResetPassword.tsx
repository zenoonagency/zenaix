import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Eye, EyeOff, CheckCircle, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "../components/ui/Input";
import { useThemeStore } from "../store/themeStore";
import { ParticlesEffect } from "../components/effects/ParticlesEffect";
import { useToast } from "../hooks/useToast";
import { supabase } from "../lib/supabaseClient"; 

export function ResetPassword() {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [canReset, setCanReset] = useState(false);

  const { theme } = useThemeStore();
  const { showToast } = useToast();

  const logoUrl =
    theme === "dark"
      ? "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png"
      : "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-DARK.png";

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "PASSWORD_RECOVERY") {
        setCanReset(true); // Libera o formulário para o usuário digitar a nova senha.
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("A nova senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) throw updateError;
      
      setSuccess(true);
      showToast("Senha redefinida com sucesso!", "success");

    } catch (error: any) {
      const message = "O link de recuperação pode ter expirado. Por favor, solicite um novo.";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };
  
  const toggleShowNewPassword = () => setShowNewPassword(!showNewPassword);
  const toggleShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  if (success) {
    // Sua tela de sucesso está ótima e não precisa de mudanças.
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
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
              Senha redefinida!
            </h2>
            <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
              Sua senha foi redefinida com sucesso! Você já pode fazer login com sua nova senha.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-full bg-[#7f00ff] text-white py-2 px-4 rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2 transition-colors"
            >
              Fazer Login
            </button>
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
      >
        <div className="flex items-center justify-center mb-6">
          <img src={logoUrl} alt="Logo" className="w-24" />
        </div>
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          Redefinir Senha
        </h2>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
          Digite sua nova senha abaixo.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              label="Nova Senha"
              placeholder="No mínimo 6 caracteres"
              required
            />
            <button type="button" onClick={toggleShowNewPassword} className="absolute right-3 top-[47px] transform -translate-y-1/2 text-gray-500">
              {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="relative">
            <Input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              label="Confirmar Nova Senha"
              placeholder="Digite a senha novamente"
              required
            />
            <button type="button" onClick={toggleShowConfirmPassword} className="absolute right-3 top-[47px] transform -translate-y-1/2 text-gray-500">
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="space-y-3 pt-2">
            <button
              type="submit"
              disabled={loading || !canReset}
              className="w-full bg-[#7f00ff] text-white py-2 px-4 rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {loading ? "Redefinindo..." : "Redefinir Senha"}
            </button>
            <Link to="/login" className="w-full bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 py-2 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-dark-600 transition-colors flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Login
            </Link>
          </div>
        </form>
      </motion.div>
    </div>
  );
}