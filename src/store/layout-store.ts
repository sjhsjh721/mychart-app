import { create } from "zustand";

type LayoutState = {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
};

export const useLayoutStore = create<LayoutState>((set) => ({
  sidebarCollapsed: true, // 모바일 우선: 기본값 닫힘
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}));
