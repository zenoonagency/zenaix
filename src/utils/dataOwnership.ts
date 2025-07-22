import { useAuthStore } from "../store/authStore";

export interface DataOwnershipCheck {
  organization_id?: string;
  creator_id?: string;
  user_id?: string;
  owner_id?: string;
  created_by?: string;
}

/**
 * Verifica se os dados pertencem ao usuário logado ou à sua organização
 */
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

  // Verifica se pertence à organização do usuário
  if (data.organization_id && data.organization_id === organization.id) {
    return true;
  }

  return false;
};

/**
 * Filtra uma lista de dados para mostrar apenas os que pertencem ao usuário
 */
export const filterUserData = <T extends DataOwnershipCheck>(
  dataList: T[]
): T[] => {
  return dataList.filter(checkDataOwnership);
};

/**
 * Remove dados que não pertencem ao usuário atual
 */
export const cleanUserData = <T extends DataOwnershipCheck>(
  dataList: T[]
): T[] => {
  return dataList.filter(checkDataOwnership);
};
