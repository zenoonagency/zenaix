import React from "react";
import { motion } from "framer-motion";
import { authService } from "../../services/authService";
import { useToast } from "../../hooks/useToast";
import { handleSupabaseError } from "../../utils/supabaseErrorTranslator";

interface OAuthButtonsInviteProps {
  className?: string;
  org?: string | null;
  inviteToken?: string | null;
}

export function OAuthButtonsInvite({
  className = "",
  org,
  inviteToken,
}: OAuthButtonsInviteProps) {
  const { showToast } = useToast();

  const handleOAuthLogin = async (provider: string) => {
    try {
      // Armazenar dados do convite no sessionStorage para recuperar depois do OAuth
      if (org && inviteToken) {
        sessionStorage.setItem("invite_org", org);
        sessionStorage.setItem("invite_token", inviteToken);
      }

      await authService.loginWithOAuth(provider);
    } catch (error) {
      const message = handleSupabaseError(error, "Erro no login social");
      showToast(message, "error");
    }
  };

  const oauthProviders = [
    {
      name: "google",
      label: "Google",
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="#4285f4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34a853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#fbbc05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="#ea4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
      color: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300",
    },
  ];

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300 dark:border-gray-600" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white dark:bg-dark-800 text-gray-500 dark:text-gray-400">
            Ou continue com
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {oauthProviders.map((provider, index) => (
          <motion.button
            key={provider.name}
            type="button"
            onClick={() => handleOAuthLogin(provider.name)}
            className={`pointer-events-none !opacity-40 w-full flex items-center justify-center px-4 py-2 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7f00ff] ${provider.color}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index, duration: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={true}
          >
            {provider.icon}
            <span className="ml-3">Continuar com {provider.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
