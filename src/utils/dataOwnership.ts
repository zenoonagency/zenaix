import { useAuthStore } from "../store/authStore";

export interface DataOwnershipCheck {
  organization_id?: string;
  creator_id?: string;
  user_id?: string;
  owner_id?: string;
  created_by?: string;
}

export const checkDataOwnership = (data: DataOwnershipCheck): boolean => {
  const { user, organization } = useAuthStore.getState();

  if (!user || !organization) {
    return false;
  }

  // Verifica se o usuário é o criador/proprietário
  if (data.creator_id && data.creator_id === user.id) {
    return true;
  }

  if (data.user_id && data.user_id === user.id) {
    return true;
  }

  if (data.owner_id && data.owner_id === user.id) {
    return true;
  }

  if (data.created_by && data.created_by === user.id) {
    return true;
  }

  if (data.organization_id && data.organization_id === organization.id) {
    return true;
  }

  return false;
};

export const filterUserData = <T extends DataOwnershipCheck>(
  dataList: T[]
): T[] => {
  return dataList.filter(checkDataOwnership);
};

export const cleanUserData = <T extends DataOwnershipCheck>(
  dataList: T[]
): T[] => {
  const { user, organization } = useAuthStore.getState();
  if (!user || !organization) return [];
  return dataList.filter((data) => {
    if (data.organization_id && data.organization_id === organization.id)
      return true;
    if (data.creator_id && data.creator_id === user.id) return true;
    if (data.user_id && data.user_id === user.id) return true;
    if (data.owner_id && data.owner_id === user.id) return true;
    if (data.created_by && data.created_by === user.id) return true;
    return false;
  });
};
