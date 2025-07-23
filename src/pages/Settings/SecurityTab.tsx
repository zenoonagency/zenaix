import React, { useState } from "react";
import { useAuthStore } from "../../store/authStore";
import { authService } from "../../services/authService";
import { useToast } from "../../hooks/useToast";
import { Input } from "../../components/ui/Input";
import { Eye, EyeOff, Shield, Key, Lock, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";

export function SecurityTab() {
  const { user, token } = useAuthStore();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações
    if (!currentPassword) {
      showToast("Digite sua senha atual", "error");
      return;
    }

    if (newPassword.length < 6) {
      showToast("A nova senha deve ter no mínimo 6 caracteres", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("As senhas não coincidem", "error");
      return;
    }

    setIsLoading(true);

    try {
      // Primeiro verificar se a senha atual está correta
      await authService.login({
        email: user?.email || "",
        password: currentPassword,
      });

      // Se chegou aqui, a senha atual está correta
      // Agora atualizar para a nova senha
      await authService.changePassword(token, currentPassword, newPassword);

      showToast("Senha alterada com sucesso!", "success");

      // Limpar formulário
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erro ao alterar senha";
      showToast(message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Seção de Alteração de Senha */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Key className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Alterar Senha
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Mantenha sua conta segura com uma senha forte
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Senha Atual */}
            <div className="relative">
              <Input
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                label="Senha Atual"
                placeholder="Digite sua senha atual"
                required
              />
              <button
                type="button"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-[47px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Nova Senha */}
            <div className="relative">
              <Input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                label="Nova Senha"
                placeholder="Mínimo 6 caracteres"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-[47px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                {showNewPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {/* Confirmar Nova Senha */}
            <div className="relative">
              <Input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                label="Confirmar Nova Senha"
                placeholder="Digite a nova senha novamente"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-[47px] transform -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Alterando..." : "Alterar Senha"}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Seção de Segurança Adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Segurança da Conta
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configurações adicionais de segurança
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Autenticação de Dois Fatores */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <Lock className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Autenticação de Dois Fatores
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Adicione uma camada extra de segurança
                </p>
              </div>
            </div>
            <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
              Configurar
            </button>
          </div>

          {/* Sessões Ativas */}
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Sessões Ativas
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Gerencie dispositivos conectados
                </p>
              </div>
            </div>
            <button className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium">
              Ver Sessões
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
