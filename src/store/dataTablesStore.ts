import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DataTable, DataTablesState } from '../types/dataTables';
import { generateId } from '../utils/generateId';

// Custom storage with size limits and data compression
const createCustomStorage = () => {
  const MAX_ITEMS = 100; // Maximum number of tables
  const MAX_ROWS = 1000; // Maximum rows per table
  
  return {
    getItem: (name: string) => {
      const str = localStorage.getItem(name);
      if (!str) return null;
      try {
        return JSON.parse(str);
      } catch {
        return null;
      }
    },
    setItem: (name: string, value: any) => {
      try {
        // Limit the number of tables and rows per table
        if (value.state?.tables) {
          value.state.tables = value.state.tables
            .slice(0, MAX_ITEMS)
            .map((table: DataTable) => ({
              ...table,
              data: table.data.slice(0, MAX_ROWS),
            }));
        }
        localStorage.setItem(name, JSON.stringify(value));
      } catch (err) {
        console.error('Storage error:', err);
      }
    },
    removeItem: (name: string) => localStorage.removeItem(name),
  };
};

export const useDataTablesStore = create<DataTablesState>()(
  persist(
    (set, get) => ({
      tables: [],
      activeTableId: null,

      addTable: (tableData) => {
        const tables = get().tables;
        if (tables.length >= 100) {
          throw new Error('Limite máximo de tabelas atingido (100)');
        }

        const newTable: DataTable = {
          ...tableData,
          id: generateId(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          data: tableData.data.slice(0, 1000), // Limit rows
        };

        set((state) => ({
          tables: [...state.tables, newTable],
          activeTableId: newTable.id,
        }));
      },

      updateTable: (id, updates) =>
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === id
              ? {
                  ...table,
                  ...updates,
                  updatedAt: new Date().toISOString(),
                  data: updates.data ? updates.data.slice(0, 1000) : table.data,
                }
              : table
          ),
        })),

      deleteTable: (id) =>
        set((state) => ({
          tables: state.tables.filter((table) => table.id !== id),
          activeTableId: state.activeTableId === id ? null : state.activeTableId,
        })),

      setActiveTable: (id) =>
        set({
          activeTableId: id,
        }),

      importData: (tableId, data) =>
        set((state) => ({
          tables: state.tables.map((table) =>
            table.id === tableId
              ? {
                  ...table,
                  data: data.slice(0, 1000), // Limit imported rows
                  updatedAt: new Date().toISOString(),
                }
              : table
          ),
        })),
    }),
    {
      name: 'data-tables-store',
      storage: createJSONStorage(() => createCustomStorage()),
      version: 1,
    }
  )
);