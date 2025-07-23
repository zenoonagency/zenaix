import React, { useState, useEffect } from "react";
import { useAuthStore } from "../../store/authStore";
import { userService } from "../../services/user/user.service";
import { useToast } from "../../hooks/useToast";
import { LANGUAGE_OPTIONS } from "../../contexts/LocalizationContext";
import { TIMEZONE_OPTIONS } from "../../utils/dateUtils";
import { Settings, Globe, Clock, Palette, Bell } from "lucide-react";
import { motion } from "framer-motion";

export function PreferencesTab() {
  const { user, token, updateUser } = useAuthStore();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    language: user?.language || "pt-BR",
    timezone: user?.timezone || "America/Sao_Paulo",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        language: user.language || "pt-BR",
        timezone: user.timezone || "America/Sao_Paulo",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (!token) throw new Error("Usuário não autenticado.");

      const updatedUser = await userService.updateProfile(token, {
        ...formData,
        name: user?.name || "",
      });

      updateUser(updatedUser);
      showToast("Preferências atualizadas com sucesso!", "success");
    } catch (error) {
      showToast("Erro ao atualizar preferências. Tente novamente.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Seção de Idioma e Região */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Idioma e Região
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure o idioma e fuso horário da sua conta
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Idioma */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Idioma
              </label>
              <select
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition duration-200"
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Fuso Horário */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Fuso Horário
              </label>
              <select
                name="timezone"
                value={formData.timezone}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition duration-200"
              >
                {TIMEZONE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {isLoading ? "Salvando..." : "Salvar Preferências"}
            </button>
          </form>
        </div>
      </motion.div>

      {/* Seção de Aparência */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Palette className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Aparência
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Personalize a aparência da interface
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Tema */}
          <div className="relative">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg blur-[0.5px] opacity-75">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Tema da Interface
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Escolha entre tema claro ou escuro
                  </p>
                </div>
              </div>
              <select className="text-sm border border-gray-300 dark:border-dark-600 rounded px-2 py-1 bg-white dark:bg-dark-700 dark:text-white">
                <option value="auto">Automático</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>
            {/* Overlay "Em breve" */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-dark-800/60 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-700 px-3 py-1 rounded-full border border-gray-200 dark:border-dark-600 shadow-sm">
                Em breve
              </span>
            </div>
          </div>

          {/* Densidade */}
          <div className="relative">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg blur-[0.5px] opacity-75">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Densidade da Interface
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ajuste o espaçamento dos elementos
                  </p>
                </div>
              </div>
              <select className="text-sm border border-gray-300 dark:border-dark-600 rounded px-2 py-1 bg-white dark:bg-dark-700 dark:text-white">
                <option value="comfortable">Confortável</option>
                <option value="compact">Compacto</option>
              </select>
            </div>
            {/* Overlay "Em breve" */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-dark-800/60 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-700 px-3 py-1 rounded-full border border-gray-200 dark:border-dark-600 shadow-sm">
                Em breve
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Seção de Notificações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-gray-200 dark:border-dark-700"
      >
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notificações
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Configure como você recebe notificações
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Email */}
          <div className="relative">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg blur-[0.5px] opacity-75">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Notificações por Email
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receba atualizações importantes por email
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {/* Overlay "Em breve" */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-dark-800/60 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-700 px-3 py-1 rounded-full border border-gray-200 dark:border-dark-600 shadow-sm">
                Em breve
              </span>
            </div>
          </div>

          {/* Push */}
          <div className="relative">
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-dark-700 rounded-lg blur-[0.5px] opacity-75">
              <div className="flex items-center space-x-3">
                <Bell className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    Notificações Push
                  </h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Receba notificações em tempo real
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
              </label>
            </div>
            {/* Overlay "Em breve" */}
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-dark-800/60 rounded-lg">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 bg-white dark:bg-dark-700 px-3 py-1 rounded-full border border-gray-200 dark:border-dark-600 shadow-sm">
                Em breve
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
