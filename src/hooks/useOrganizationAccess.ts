import { useAuthStore } from "../store/authStore";

export const useOrganizationAccess = () => {
  const { user, organization } = useAuthStore();

  // Debug disponível no componente DebugAccessInfo

  // Verificar se tem organização E se a subscription está ativa
  const hasActiveSubscription = organization?.subscription_status === "ACTIVE";

  // MODO DE TESTE: Force o bloqueio para testar
  // Para testar a proteção, descomente a linha abaixo e comente a lógica normal:
  // const hasOrganization = false; // Force block for testing

  const hasOrganization = !!(
    user?.organization_id &&
    organization &&
    hasActiveSubscription
  );

  const checkAccess = (path: string): boolean => {
    // Rotas permitidas sem organização (verificação exata)
    const exactAllowedPaths = ["/dashboard"];

    // Rotas permitidas com prefixo
    const prefixAllowedPaths = [
      "/dashboard/plans",
      "/dashboard/profile",
      "/dashboard/settings",
      "/dashboard/help",
    ];

    // Verificar rota exata primeiro (apenas /dashboard)
    if (exactAllowedPaths.includes(path)) {
      return true;
    }

    // Verificar rotas com prefixo
    if (
      prefixAllowedPaths.some((allowedPath) => path.startsWith(allowedPath))
    ) {
      return true;
    }

    // Para outras rotas, precisa ter organização com subscription ativa
    return hasOrganization;
  };

  return {
    hasOrganization,
    hasActiveSubscription,
    checkAccess,
    organizationId: user?.organization_id,
    organizationName: organization?.name,
    subscriptionStatus: organization?.subscription_status,
  };
};
