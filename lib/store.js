// lib/store.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      session: null,
      profile: null, // ← New: full profile from users table
      role: null, // ← New: "admin", "superadmin", etc.
      isLoading: true,
      isAuthenticated: false,

      setAuth: (user, session, profile = null) =>
        set({
          user,
          session,
          profile,
          role: profile?.role || null,
          isAuthenticated: !!user,
          isLoading: false,
        }),

      setProfile: (profile) =>
        set((state) => ({
          profile,
          role: profile?.role || null,
        })),

      logout: () =>
        set({
          user: null,
          session: null,
          profile: null,
          role: null,
          isAuthenticated: false,
          isLoading: false,
        }),

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user
          ? { id: state.user.id, email: state.user.email }
          : null,
        profile: state.profile
          ? { id: state.profile.id, role: state.profile.role }
          : null,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
