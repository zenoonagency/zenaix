import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { authService } from "../services/authService";
import { useToast } from "../hooks/useToast";
import { Loader2 } from "lucide-react";

export function OAuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(true);
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Evitar processamento múltiplo
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const handleOAuthCallback = async () => {
      try {
        console.log("=== DEBUG OAuth Callback ===");
        console.log("URL completa:", window.location.href);
        console.log("Hash:", window.location.hash);
        console.log("Search params:", searchParams.toString());

        // Verificar se há access_token no hash (Supabase OAuth)
        const hash = window.location.hash;
        if (hash && hash.includes("access_token=")) {
          console.log("Access token encontrado no hash!");

          // Extrair access_token do hash
          const hashParams = new URLSearchParams(hash.substring(1)); // Remove o #
          const accessToken = hashParams.get("access_token");

          if (accessToken) {
            console.log(
              "Access token extraído:",
              accessToken.substring(0, 20) + "..."
            );
            showToast("Processando login com Google...", "info");

            try {
              // Enviar access_token para nosso backend processar
              const response = await fetch("/api/auth/oauth/callback", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ access_token: accessToken }),
              });

              if (response.ok) {
                const data = await response.json();

                // Montar dados no formato esperado pelo authStore
                const authData = {
                  user: data.data,
                  token: data.token,
                  organization: data.data.organization || null,
                  permissions: data.data.permissions || [],
                };

                login(authData);
                navigate("/dashboard");
                return;
              } else {
                const errorData = await response.json();
                throw new Error(
                  errorData.message || "Falha ao processar OAuth"
                );
              }
            } catch (fetchError) {
              console.error("Erro ao processar access_token:", fetchError);
              showToast("Erro ao processar login. Tente novamente.", "error");
              setTimeout(() => navigate("/login"), 2000);
              return;
            }
          }
        }

        // Verificar se há código do Google OAuth (fluxo alternativo)
        const code = searchParams.get("code");
        const state = searchParams.get("state");

        if (code) {
          console.log("Código OAuth recebido:", code);
          showToast("Processando código OAuth...", "info");
          setTimeout(() => {
            showToast("Implementação de código OAuth em andamento.", "info");
            navigate("/login");
          }, 2000);
          return;
        }

        // Verificar se há parâmetros de sucesso OAuth (nosso sistema legado)
        if (searchParams.get("oauth_success")) {
          console.log("Parâmetros oauth_success encontrados");
          const authData = await authService.handleOAuthCallback(searchParams);
          if (authData) {
            login(authData);
            navigate("/dashboard");
            return;
          }
        }

        // Verificar se há parâmetros de erro OAuth
        if (searchParams.get("oauth_error")) {
          const errorMessage =
            searchParams.get("message") || "Erro no login social";
          console.log("Erro OAuth:", errorMessage);
          showToast(errorMessage, "error");
          navigate("/login");
          return;
        }

        // Se não há parâmetros esperados
        console.log("Nenhum parâmetro OAuth válido encontrado");
        showToast("Redirecionando para login...", "info");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } catch (error) {
        console.error("OAuth Callback Error:", error);
        const message =
          error instanceof Error ? error.message : "Erro no login social";
        showToast(message, "error");
        setTimeout(() => {
          navigate("/login");
        }, 1500);
      } finally {
        setIsProcessing(false);
      }
    };

    handleOAuthCallback();
  }, []); // Array vazio para executar apenas uma vez

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-900">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-[#7f00ff]" />
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
          Processando login...
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          Aguarde enquanto verificamos suas credenciais.
        </p>
      </div>
    </div>
  );
}
