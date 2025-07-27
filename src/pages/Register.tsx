import React, { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Loader2,
  Eye,
  EyeOff,
  Upload,
  X,
  ArrowLeft,
  ArrowRight,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "../components/ui/Input";
import { useAuthStore } from "../store/authStore";
import { useToast } from "../hooks/useToast";
import { useNotification } from "../hooks/useNotification";
import { authService } from "../services/authService";
import { RegisterData } from "../types/auth";
import { LANGUAGE_OPTIONS } from "../contexts/LocalizationContext";
import { TIMEZONE_OPTIONS } from "../utils/dateUtils";
import { useThemeStore } from "../store/themeStore";
import { ParticlesEffect } from "../components/effects/ParticlesEffect";
import { NotificationSingle } from "../components/Notification";
import { userService } from "../services/user/user.service";
import { compressImage } from "../utils/imageCompression";
import { supabase } from "../lib/supabaseClient";

export function Register() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<RegisterData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    avatar: undefined,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const { showToast } = useToast();
  const { notification, showNotification, hideNotification } =
    useNotification();
  const { theme } = useThemeStore();

  // Redireciona se já estiver autenticado
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

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
      : "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-DARK.png";

  const handleInputChange = (
    field: keyof RegisterData,
    value: string | File | undefined
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const result = await compressImage(file, { maxSizeKB: 300 });

      if (result.success && result.file) {
        handleInputChange("avatar", result.file);
        setAvatarPreview(URL.createObjectURL(result.file));
      
      } else {
        showToast(result.error || "Erro ao processar imagem", "error");
      }
    }
  };

  const removeAvatar = () => {
    handleInputChange("avatar", undefined);
    setAvatarPreview("");
  };

  const nextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (currentStep === 1) {
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.confirmPassword
      ) {
        setError("Preencha todos os campos obrigatórios");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("As senhas não coincidem");
        return;
      }
      if (formData.password.length < 6) {
        setError("A senha deve ter pelo menos 6 caracteres");
        return;
      }
    }
    setError("");
    setCurrentStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            // Outros metadados que você queira salvar no registro
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("Não foi possível criar o usuário.");


      showToast("Conta criada com sucesso! Configurando seu perfil...", "success");

    
      if (formData.avatar) {
        const fileExtension = formData.avatar.type.split("/")[1];
        const filePath = `${signUpData.user.id}/avatar.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(filePath, formData.avatar, { upsert: true }); 

        if (uploadError) {
          throw new Error("Sua conta foi criada, mas houve um erro ao enviar o avatar. Tente novamente no seu perfil.");
        }

        const { data: urlData } = supabase.storage
          .from("avatars")
          .getPublicUrl(filePath);

  
        await supabase.auth.updateUser({
          data: {
            avatar_url: urlData.publicUrl,
          },
        });
      }
    } catch (error: any) {
      const message = error.message || "Erro ao registrar usuário";
      setError(message);
      showToast(message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/login");
  };

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const toggleShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {notification && (
        <NotificationSingle
          message={notification.message}
          type={notification.type}
          onClose={hideNotification}
        />
      )}

      {/* Efeito de partículas no fundo */}
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
          <img src={logoUrl} alt="Register" className="w-24" />
        </motion.div>

        <motion.h2
          className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white"
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
        >
          {currentStep === 1 ? "Criar Conta" : "Configurações"}
        </motion.h2>

        {/* Indicador de progresso */}
        <div className="flex items-center justify-center mb-6">
          <div className="flex space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${
                currentStep >= 1 ? "bg-[#7f00ff]" : "bg-gray-300"
              }`}
            ></div>
            <div
              className={`w-3 h-3 rounded-full ${
                currentStep >= 2 ? "bg-[#7f00ff]" : "bg-gray-300"
              }`}
            ></div>
          </div>
        </div>

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
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  label="Nome completo"
                  required
                />
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  label="Email"
                  required
                />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange("password", e.target.value)
                    }
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
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) =>
                      handleInputChange("confirmPassword", e.target.value)
                    }
                    label="Confirmar senha"
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
            )}

            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Avatar (opcional)
                  </label>
                  <div className="flex items-center space-x-4">
                    {avatarPreview ? (
                      <div className="relative">
                        <img
                          src={avatarPreview}
                          alt="Avatar preview"
                          className="w-16 h-16 rounded-full object-cover border-2 border-[#7f00ff]"
                        />
                        <button
                          type="button"
                          onClick={removeAvatar}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <label className="cursor-pointer bg-gray-100 dark:bg-gray-700 px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      <Upload className="w-4 h-4 inline mr-2" />
                      Escolher arquivo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Combo box de Fuso Horário */}
                <div>
                  <label
                    htmlFor="timezone"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Fuso Horário
                  </label>
                  <select
                    id="timezone"
                    name="timezone"
                    value={formData.timezone}
                    onChange={(e) =>
                      handleInputChange("timezone", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent outline-none"
                  >
                    {TIMEZONE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Combo box de Linguagem */}
                <div>
                  <label
                    htmlFor="language"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Idioma
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={formData.language}
                    onChange={(e) =>
                      handleInputChange("language", e.target.value)
                    }
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-[#7f00ff] focus:border-transparent outline-none"
                  >
                    {LANGUAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex space-x-3 pt-4">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </button>
            )}

            {currentStep < 2 ? (
              <button
                type="button"
                onClick={(e) => nextStep(e)}
                className="flex-1 flex items-center justify-center px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 transition-colors"
              >
                Próximo
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-[#7f00ff] text-white py-2 px-4 rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2 disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processando...
                  </span>
                ) : (
                  "Cadastrar"
                )}
              </button>
            )}
          </div>
        </form>

        <motion.p
          className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.3 }}
        >
          Já tem uma conta?{" "}
          <Link
            to="/login"
            className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
            onClick={handleLoginClick}
          >
            Faça login
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}
