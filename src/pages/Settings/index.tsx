import { useState } from "react";
import { useToast } from "../../hooks/useToast";
import { ProfileTab } from "./ProfileTab";
import { SecurityTab } from "./SecurityTab";
import { PreferencesTab } from "./PreferencesTab";
import { SubscriptionTab } from "./SubscriptionTab";
import { useAuthStore } from "../../store/authStore";
import {
  User,
  Shield,
  Settings as SettingsIcon,
  CreditCard,
} from "lucide-react";

export function Settings() {
  const [activeTab, setActiveTab] = useState<
    "profile" | "security" | "preferences" | "subscription"
  >("profile");

  const { user, organization } = useAuthStore();
  const { showToast } = useToast();
  const isMaster = organization?.master_user_id === user?.id;

  const tabs = [
    {
      id: "profile" as const,
      name: "Perfil",
      icon: User,
      description: "Informações básicas da conta",
    },
    {
      id: "security" as const,
      name: "Segurança",
      icon: Shield,
      description: "Senha e configurações de segurança",
    },
    {
      id: "preferences" as const,
      name: "Preferências",
      icon: SettingsIcon,
      description: "Idioma, tema e notificações",
    },
    ...(isMaster
      ? [
          {
            id: "subscription" as const,
            name: "Assinatura",
            icon: CreditCard,
            description: "Plano e pagamentos",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212]">
      {/* Cabeçalho */}
      <div className="p-8 pb-0">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Configurações
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">
          Gerencie as configurações do seu sistema
        </p>

        {/* Navegação por abas */}
        <div className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                className={`flex items-center space-x-2 px-4 py-3 text-sm font-medium rounded-t-lg transition-colors ${
                  activeTab === tab.id
                    ? "text-purple-600 dark:text-purple-400 bg-white dark:bg-dark-800 border-b-2 border-purple-600 dark:border-purple-400"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Conteúdo das abas */}
      <div className="px-8 pb-8">
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "security" && <SecurityTab />}
        {activeTab === "preferences" && <PreferencesTab />}
        {activeTab === "subscription" && isMaster && <SubscriptionTab />}
      </div>
    </div>
  );
}
