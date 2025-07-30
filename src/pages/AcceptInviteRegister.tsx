import React, { useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
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
import { useThemeStore } from "../store/themeStore";
import { ParticlesEffect } from "../components/effects/ParticlesEffect";
import { inviteService } from "../services/invite/invite.service";
import { LANGUAGE_OPTIONS } from "../contexts/LocalizationContext";
import { TIMEZONE_OPTIONS } from "../utils/dateUtils";
import { userService } from "../services/user/user.service";
import { compressImage } from "../utils/imageCompression";
import { OAuthButtonsInvite } from "../components/auth/OAuthButtonsInvite";
import { supabase } from "../lib/supabaseClient";
import { handleSupabaseError } from "../utils/supabaseErrorTranslator";
import { authService } from "../services/authService";

export function AcceptInviteRegister() {
  const [searchParams] = useSearchParams();
  const org = searchParams.get("org");
  const inviteToken = searchParams.get("token");
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    language: "pt-BR",
    timezone: "America/Sao_Paulo",
    avatar: undefined as File | undefined,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const { showToast } = useToast();
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const { setUserDataFromMe, clearAuth } = useAuthStore.getState();


  const logoUrl =
    theme === "dark"
      ? "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-LIGHT.png"
      : "https://zenaix.com.br/wp-content/uploads/2025/03/LOGO-DARK.png";

  const handleInputChange = (
    field: string,
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
      // 1. Registro via backend
      const response = await authService.register(formData);
      // 2. Ativar sessão no Supabase
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: response.session.access_token,
        refresh_token: response.session.refresh_token,
      });
      if (sessionError) {
        throw sessionError;
      }
      // 3. Upload do avatar (opcional)
      if (formData.avatar) {
        try {
          const fileExtension = formData.avatar.type.split("/")[1];
          const filePath = `${response.session.user.id}/avatar.${fileExtension}`;
          const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, formData.avatar, { upsert: true });
          if (uploadError) throw uploadError;
          const { data: urlData } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);
          await supabase.auth.updateUser({
            data: { avatar_url: urlData.publicUrl },
          });
        } catch (avatarError) {
          showToast(
            "A sua conta foi criada, mas houve um erro ao enviar o seu avatar, tente novamente nas configurações do seu perfil.",
            "warning"
          );
        }
      }
      // 4. Buscar getMe com access_token
      const token = response.session.access_token;
      const meResponse = await userService.getMe(token);
      if (!meResponse) throw new Error("Erro ao buscar dados do usuário");
      // 5. Salvar tudo na store
      setUserDataFromMe(meResponse);
      // 6. Aceitar convite
      if (inviteToken) {
        await inviteService.acceptInvite(token, { token: inviteToken });
      }
      // 7. Redirecionar
      showToast("Convite aceito com sucesso!", "success");
      navigate("/dashboard");
    } catch (error: any) {
      await supabase.auth.signOut();
      const message = handleSupabaseError(error, "Erro ao registrar");
      setError(message);
      if (
        message.toLowerCase().includes("já existe") ||
        message.toLowerCase().includes("already registered")
      ) {
        showToast(
          "Conta já existe, faça login para aceitar o convite.",
          "info"
        );
        navigate(
          `/accept-invite?org=${encodeURIComponent(
            org || ""
          )}&token=${encodeURIComponent(
            inviteToken || ""
          )}&email=${encodeURIComponent(formData.email)}`
        );
        return;
      }
      showToast(message, "error");
      clearAuth();
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const toggleShowPassword = () => setShowPassword(!showPassword);
  const toggleShowConfirmPassword = () =>
    setShowConfirmPassword(!showConfirmPassword);

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
          <img src={logoUrl} alt="Register" className="w-24" />
        </div>
        {org && (
          <div className="mb-6 text-center text-4xl font-bold text-purple-700">
            {org}
          </div>
        )}
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
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AnimatePresence mode="wait">
            {currentStep === 1 && (
              <motion.div
                key="step1"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  label="Nome"
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
                    label="Confirmar Senha"
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
                <div className="flex justify-end mt-4">
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2"
                  >
                    Próximo <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                </div>
              </motion.div>
            )}
            {currentStep === 2 && (
              <motion.div
                key="step2"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -20, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex flex-col  mb-4">
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
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fuso Horário
                  </label>
                  <select
                    value={formData.timezone}
                    onChange={(e) =>
                      handleInputChange("timezone", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    {TIMEZONE_OPTIONS.map((tz) => (
                      <option key={tz.value} value={tz.value}>
                        {tz.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Idioma
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) =>
                      handleInputChange("language", e.target.value)
                    }
                    className="w-full px-3.5 py-2.5 rounded-lg bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#2E2E2E] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
                  >
                    {LANGUAGE_OPTIONS.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-between mt-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center px-4 py-2 bg-gray-200 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-dark-600 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-4 py-2 bg-[#7f00ff] text-white rounded-md hover:bg-[#7f00ff]/90 focus:outline-none focus:ring-2 focus:ring-[#7f00ff] focus:ring-offset-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Registrando...
                      </span>
                    ) : (
                      "Registrar e aceitar convite"
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <OAuthButtonsInvite 
          className="mt-6" 
          org={org} 
          inviteToken={inviteToken} 
        />

        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Já tem uma conta?{" "}
          <Link
            to={`/accept-invite?org=${encodeURIComponent(
              org || ""
            )}&token=${encodeURIComponent(inviteToken || "")}`}
            className="text-[#7f00ff] hover:text-[#7f00ff]/80 transition-colors"
          >
            Entrar
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
