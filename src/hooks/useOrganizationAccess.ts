import { useAuthStore } from "../store/authStore";

export const useOrganizationAccess = () => {
  const { user, organization } = useAuthStore();

  const hasActiveSubscription = organization?.subscription_status === "ACTIVE";

  const hasOrganization = !!(
    user?.organization_id &&
    organization &&
    hasActiveSubscription
  );

  const checkAccess = (path: string): boolean => {
    const exactAllowedPaths = ["/dashboard"];

    const prefixAllowedPaths = [
      "/dashboard/plans",
      "/dashboard/profile",
      "/dashboard/settings",
      "/dashboard/help",
    ];

    if (exactAllowedPaths.includes(path)) {
      return true;
    }

    if (
      prefixAllowedPaths.some((allowedPath) => path.startsWith(allowedPath))
    ) {
      return true;
    }

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
