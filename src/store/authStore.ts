import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Session } from "@supabase/supabase-js";
import { User, AuthState } from "../types/auth"; // Seus tipos customizados
import { OrganizationOutput } from "../types/organization";
import { supabase } from "../lib/supabaseClient";
import { userService } from "../services/user/user.service";

// Função para limpar todas as stores de dados do usuário
const cleanAllUserDataStores = () => {
  console.log("[AuthStore] 🧹 Limpando todas as stores de dados do usuário");
  
  try {
    // Verificar se está fazendo logout para evitar chamadas desnecessárias
    const { isLoggingOut } = useAuthStore.getState();
    if (isLoggingOut()) {
      console.log("[AuthStore] ⏸️ Logout em andamento, pulando limpeza de stores");
      return;
    }

    // Importar e limpar todas as stores de forma mais segura
    const stores = [
      () => import('./boardStore').then(m => {
        try { m.useBoardStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar boardStore:", e); }
      }),
      () => import('./cardStore').then(m => {
        try { m.useCardStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar cardStore:", e); }
      }),
      () => import('./listStore').then(m => {
        try { m.useListStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar listStore:", e); }
      }),
      () => import('./tagStore').then(m => {
        try { m.useTagStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar tagStore:", e); }
      }),
      () => import('./contractStore').then(m => {
        try { m.useContractStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar contractStore:", e); }
      }),
      () => import('./transactionStore').then(m => {
        try { m.useTransactionStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar transactionStore:", e); }
      }),
      () => import('./teamMembersStore').then(m => {
        try { m.useTeamMembersStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar teamMembersStore:", e); }
      }),
      () => import('./embedPagesStore').then(m => {
        try { m.useEmbedPagesStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar embedPagesStore:", e); }
      }),
      () => import('./whatsAppInstanceStore').then(m => {
        try { m.useWhatsAppInstanceStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar whatsAppInstanceStore:", e); }
      }),
      () => import('./inviteStore').then(m => {
        try { m.useInviteStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar inviteStore:", e); }
      }),
      () => import('./dashboardStore').then(m => {
        try { m.useDashboardStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar dashboardStore:", e); }
      }),
      () => import('./dashboardTransactionStore').then(m => {
        try { m.useDashboardTransactionStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar dashboardTransactionStore:", e); }
      }),
      () => import('./dataTablesStore').then(m => {
        try { m.useDataTablesStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar dataTablesStore:", e); }
      }),
      () => import('./systemPermissionsStore').then(m => {
        try { m.useSystemPermissionsStore.getState().cleanUserData(); } 
        catch (e) { console.warn("[AuthStore] Erro ao limpar systemPermissionsStore:", e); }
      }),
    ];

    // Executar limpeza de forma assíncrona e silenciosa
    Promise.allSettled(stores.map(store => store())).then(() => {
      console.log("[AuthStore] ✅ Limpeza de stores concluída");
    }).catch(error => {
      console.warn("[AuthStore] ⚠️ Alguns erros durante limpeza de stores:", error);
    });

  } catch (error) {
    console.warn("[AuthStore] ⚠️ Erro geral ao limpar stores:", error);
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      token: null,
      organization: null,
      permissions: [],
      _hasHydrated: false,
      _isLoggingOut: false,

      setSession: (session: Session) => {
        const currentUser = get().user;
        const supabaseUser = session.user;

        if (!supabaseUser) return;

        if (currentUser && currentUser.id !== supabaseUser.id) {
          cleanAllUserDataStores();
        }

        // Extrair organização diretamente dos metadados do usuário
        const organizationFromMetadata = supabaseUser.user_metadata?.organization;
        
        // Mapear a organização com todos os campos disponíveis
        const mappedOrganization = organizationFromMetadata ? {
          id: organizationFromMetadata.id,
          name: organizationFromMetadata.name,
          document: organizationFromMetadata.document,
          master_user_id: organizationFromMetadata.master_user_id,
          plan_id: organizationFromMetadata.plan_id,
          subscription_status: organizationFromMetadata.subscription_status,
          stripe_customer_id: organizationFromMetadata.stripe_customer_id,
          stripe_subscription_id: organizationFromMetadata.stripe_subscription_id,
          extra_boards: organizationFromMetadata.extra_boards || 0,
          extra_contacts: organizationFromMetadata.extra_contacts || 0,
          extra_team_members: organizationFromMetadata.extra_team_members || 0,
          extra_triggers: organizationFromMetadata.extra_triggers || 0,
          extra_whatsapp_instances: organizationFromMetadata.extra_whatsapp_instances || 0,
          one_time_triggers: organizationFromMetadata.one_time_triggers || 0,
          triggers_used_this_month: organizationFromMetadata.triggers_used_this_month || 0,
          subscription_ends_at: organizationFromMetadata.subscription_ends_at,
          created_at: organizationFromMetadata.created_at,
          updated_at: organizationFromMetadata.updated_at,
        } : null;
        
        const mappedUser: User = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          name: supabaseUser.user_metadata?.name || 'Usuário',
          first_name: supabaseUser.user_metadata?.first_name,
          last_name: supabaseUser.user_metadata?.last_name,
          role: supabaseUser.user_metadata?.role || 'TEAM_MEMBER',
          organization_id: supabaseUser.user_metadata?.organization_id,
          avatar_url: supabaseUser.user_metadata?.avatar_url,
          
          organization: mappedOrganization,
          
          language: supabaseUser.user_metadata?.language || 'pt-BR',
          timezone: supabaseUser.user_metadata?.timezone || 'America/Sao_Paulo',
          created_at: supabaseUser.user_metadata?.created_at || supabaseUser.created_at,
          updated_at: supabaseUser.user_metadata?.updated_at || supabaseUser.updated_at || supabaseUser.created_at,
          email_verified: supabaseUser.user_metadata?.email_verified || false,
          permissions: [], 
        };
        
        set({
          isAuthenticated: true,
          token: session.access_token,
          user: mappedUser,
          organization: mappedOrganization,
        });

        console.log("[AuthStore] Sessão definida:", {
          hasOrganization: !!mappedOrganization,
          organization: mappedOrganization,
          userRole: supabaseUser.user_metadata?.role,
          hasDocument: !!mappedOrganization?.document,
          subscriptionStatus: mappedOrganization?.subscription_status
        });

        // Só buscar dados adicionais se não tivermos a organização completa
        if (!mappedOrganization) {
          get().fetchAndSetDeepUserData();
        }
      },

      fetchAndSetDeepUserData: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const fullUserPayload = await userService.getMe(token);

          set({
            user: fullUserPayload,
            organization: fullUserPayload.organization,
            permissions: fullUserPayload.permissions,
          });

        } catch (error) {
          console.error("Falha ao buscar dados completos do usuário:", error);
          get().logout();
        }
      },

      logout: () => {
        console.log("[AuthStore] 🚪 Iniciando logout...");
        
        // Marcar que está fazendo logout para evitar chamadas de API
        set({ _isLoggingOut: true });
        
        // Limpar dados primeiro para evitar erros durante o logout
        get().clearAuth();
        
        // Fazer logout do Supabase
        supabase.auth.signOut().then(() => {
          console.log("[AuthStore] ✅ Logout do Supabase concluído");
          set({ _isLoggingOut: false });
        }).catch((error) => {
          console.error("[AuthStore] ❌ Erro no logout do Supabase:", error);
          set({ _isLoggingOut: false });
        });
      },

      clearAuth: () => {
        console.log("[AuthStore] 🧹 Limpando dados de autenticação...");
        
        // Limpar estado primeiro
        set({
          isAuthenticated: false,
          user: null,
          token: null,
          organization: null,
          permissions: [],
        });
        
        // Limpar outras stores de forma assíncrona
        setTimeout(() => {
          cleanAllUserDataStores();
        }, 0);
      },
      
      setOrganization: (organizationData: OrganizationOutput) => {
        set({ organization: organizationData });
      },

      // Função utilitária para verificar se está fazendo logout
      isLoggingOut: () => {
        return get()._isLoggingOut;
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
        organization: state.organization,
        permissions: state.permissions,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
          console.log("[AuthStore] Estado reidratado:", {
            isAuthenticated: state.isAuthenticated,
            hasUser: !!state.user,
            hasOrganization: !!state.organization,
            organization: state.organization
          });
        }
      },
    }
  )
);  