import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { ProfileTab } from "./ProfileTab";
import { SubscriptionTab } from "./SubscriptionTab";
import { useAuthStore } from "../../store/authStore";

export function Settings() {
  const [activeTab, setActiveTab] = useState<"profile" | "subscription">(
    "profile"
  );

  const { user, organization } = useAuthStore();
  const { showToast } = useToast();
  const isMaster = organization?.master_user_id === user?.id;

  const handleSave = () => {
    showToast("Configurações salvas com sucesso!", "success");
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Cabeçalho alinhado à esquerda e colado na borda */}
      <div className="p-8 pb-0">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
          Gerencie as configurações do seu sistema
        </p>

        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === "profile"
                ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
            onClick={() => setActiveTab("profile")}
          >
            Perfil
          </button>
          {isMaster && (
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === "subscription"
                  ? "text-purple-600 dark:text-purple-400 border-b-2 border-purple-600 dark:border-purple-400"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
              onClick={() => setActiveTab("subscription")}
            >
              Assinatura
            </button>
          )}
        </div>
      </div>

      {activeTab === "profile" ? (
        <div className="px-8 pb-8">
          <ProfileTab />
        </div>
      ) : activeTab === "subscription" ? (
        isMaster ? (
          <SubscriptionTab />
        ) : null
      ) : (
        <div />
      )}
    </div>
  );
}
