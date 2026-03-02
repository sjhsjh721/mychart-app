import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface WatchlistGroup {
  id: string;
  name: string;
  order: number;
}

export interface WatchlistItem {
  id: string;
  groupId: string;
  symbol: string;
  name: string;
  order: number;
}

export interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  updatedAt: string;
}

interface WatchlistState {
  groups: WatchlistGroup[];
  items: Record<string, WatchlistItem[]>; // groupId -> items
  prices: Record<string, PriceData>; // symbol -> price
  expandedGroups: Set<string>;

  // Actions
  setGroups: (groups: WatchlistGroup[]) => void;
  addGroup: (name: string) => void;
  removeGroup: (id: string) => void;
  renameGroup: (id: string, name: string) => void;

  setItems: (groupId: string, items: WatchlistItem[]) => void;
  addItem: (groupId: string, symbol: string, name: string) => void;
  removeItem: (groupId: string, itemId: string) => void;
  moveItem: (itemId: string, fromGroupId: string, toGroupId: string) => void;

  updatePrices: (prices: Record<string, PriceData>) => void;

  toggleGroup: (id: string) => void;
}

export const useWatchlistStore = create<WatchlistState>()(
  persist(
    (set, get) => ({
      groups: [],
      items: {},
      prices: {},
      expandedGroups: new Set(),

      setGroups: (groups) => set({ groups }),

      addGroup: (name) => {
        const newGroup: WatchlistGroup = {
          id: crypto.randomUUID(),
          name,
          order: get().groups.length,
        };
        set((state) => ({
          groups: [...state.groups, newGroup],
          items: { ...state.items, [newGroup.id]: [] },
        }));
      },

      removeGroup: (id) =>
        set((state) => ({
          groups: state.groups.filter((g) => g.id !== id),
          items: Object.fromEntries(Object.entries(state.items).filter(([key]) => key !== id)),
        })),

      renameGroup: (id, name) =>
        set((state) => ({
          groups: state.groups.map((g) => (g.id === id ? { ...g, name } : g)),
        })),

      setItems: (groupId, items) =>
        set((state) => ({
          items: { ...state.items, [groupId]: items },
        })),

      addItem: (groupId, symbol, name) => {
        const items = get().items[groupId] || [];
        const newItem: WatchlistItem = {
          id: crypto.randomUUID(),
          groupId,
          symbol,
          name,
          order: items.length,
        };
        set((state) => ({
          items: {
            ...state.items,
            [groupId]: [...(state.items[groupId] || []), newItem],
          },
        }));
      },

      removeItem: (groupId, itemId) =>
        set((state) => ({
          items: {
            ...state.items,
            [groupId]: (state.items[groupId] || []).filter((i) => i.id !== itemId),
          },
        })),

      moveItem: (itemId, fromGroupId, toGroupId) => {
        const fromItems = get().items[fromGroupId] || [];
        const item = fromItems.find((i) => i.id === itemId);
        if (!item) return;

        set((state) => ({
          items: {
            ...state.items,
            [fromGroupId]: fromItems.filter((i) => i.id !== itemId),
            [toGroupId]: [...(state.items[toGroupId] || []), { ...item, groupId: toGroupId }],
          },
        }));
      },

      updatePrices: (prices) =>
        set((state) => ({
          prices: { ...state.prices, ...prices },
        })),

      toggleGroup: (id) =>
        set((state) => {
          const expanded = new Set(state.expandedGroups);
          if (expanded.has(id)) {
            expanded.delete(id);
          } else {
            expanded.add(id);
          }
          return { expandedGroups: expanded };
        }),
    }),
    {
      name: "watchlist-storage",
      partialize: (state) => ({
        groups: state.groups,
        items: state.items,
        expandedGroups: Array.from(state.expandedGroups),
      }),
    },
  ),
);
