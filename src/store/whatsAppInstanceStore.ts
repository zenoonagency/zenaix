import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  WhatsAppInstanceOutput,
  WhatsAppInstanceState,
} from "../types/whatsappInstance";
import { whatsappInstanceService } from "../services/whatsappInstance.service";
import { APIError } from "../services/errors/api.errors";

const CACHE_DURATION = 60 * 60 * 1000;

export const useWhatsAppInstanceStore = create<WhatsAppInstanceState>()(
  persist(
    (set, get) => ({
      instances: [],
      isLoading: false,
      error: null,
      lastFetched: null,
      lastActiveInstanceId: null,

      setInstances: (instances) => set({ instances }),

      addInstance: (newInstance) =>
        set((state) => ({
          instances: [...state.instances, newInstance],
        })),

      updateInstance: (updatedInstance) =>
        set((state) => ({
          instances: state.instances.map((instance) =>
            instance.id === updatedInstance.id ? updatedInstance : instance
          ),
        })),

      deleteInstance: (instanceId) =>
        set((state) => ({
          instances: state.instances.filter(
            (instance) => instance.id !== instanceId
          ),
          // Se a instância deletada era a última ativa, limpar a referência
          lastActiveInstanceId:
            state.lastActiveInstanceId === instanceId
              ? null
              : state.lastActiveInstanceId,
        })),

      updateQrCode: (instanceId: string, qrCode: string) => {
        set((state) => ({
          instances: state.instances.map((instance) =>
            instance.id === instanceId
              ? { ...instance, qr_code: qrCode }
              : instance
          ),
        }));
      },

      setLastActiveInstance: (instanceId: string) => {
        set({ lastActiveInstanceId: instanceId });
      },

      fetchAllInstances: async (token: string, organizationId: string) => {
        const { instances, isLoading } = get();
        if (instances.length === 0) {
          set({ isLoading: true });
        }
        if (isLoading) return;
        try {
          const fetchedInstances = await whatsappInstanceService.findAll(
            token,
            organizationId
          );
          set({
            instances: fetchedInstances,
            isLoading: false,
            lastFetched: Date.now(),
          });
        } catch (err: any) {
          console.error(
            "WhatsAppInstanceStore: Erro ao buscar instâncias:",
            err
          );
          const errorMessage =
            err instanceof APIError
              ? err.message
              : "Falha ao carregar instâncias.";
          set({ error: errorMessage, isLoading: false });
        }
      },
      cleanUserData: () => {
        set({
          instances: [],
          isLoading: false,
          error: null,
          lastFetched: null,
          lastActiveInstanceId: null,
        });
      },
    }),
    {
      name: "whatsapp-instance-storage",
      partialize: (state) => ({
        instances: state.instances,
        lastActiveInstanceId: state.lastActiveInstanceId,
      }),
    }
  )
);
