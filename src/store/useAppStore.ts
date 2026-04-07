"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Branch {
  id: string;
  name: string;
  city?: string;
  address?: string;
}

interface AppState {
  // Location/Branch
  currentBranchId: string | null;
  currentBranchName: string;
  branches: Branch[];
  setCurrentBranch: (id: string, name: string) => void;
  setBranches: (branches: Branch[]) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;

  // Dark mode
  darkMode: boolean;
  toggleDarkMode: () => void;

  // User
  user: { id: string; name: string; email: string; role: string } | null;
  setUser: (user: AppState["user"]) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      currentBranchId: null,
      currentBranchName: "All Locations",
      branches: [],
      setCurrentBranch: (id, name) =>
        set({ currentBranchId: id, currentBranchName: name }),
      setBranches: (branches) => set({ branches }),

      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      darkMode: false,
      toggleDarkMode: () =>
        set((state) => {
          const newMode = !state.darkMode;
          if (typeof document !== "undefined") {
            document.documentElement.classList.toggle("dark", newMode);
          }
          return { darkMode: newMode };
        }),

      user: null,
      setUser: (user) => set({ user }),
    }),
    {
      name: "salonsoft-app-store",
      partialize: (state) => ({
        currentBranchId: state.currentBranchId,
        currentBranchName: state.currentBranchName,
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode,
      }),
    }
  )
);
