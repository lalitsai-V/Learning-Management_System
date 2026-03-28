import { create } from "zustand";

interface UIStore {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;

  // Student filters
  searchQuery: string;
  categoryFilter: string;
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: string) => void;
  clearFilters: () => void;

  // User profile
  profile: any;
  setProfile: (profile: any) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  searchQuery: "",
  categoryFilter: "all",
  setSearchQuery: (query) => set({ searchQuery: query }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  clearFilters: () => set({ searchQuery: "", categoryFilter: "all" }),

  profile: null,
  setProfile: (profile) => set({ profile }),
}));
