"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type AuthState = {
  accessToken: string | null;
  setAccessToken: (t: string | null) => void;
  reset: () => void;

  /** internal: untuk tahu kapan storage sudah direstore */
  _hasHydrated: boolean;
  _setHasHydrated: (v: boolean) => void;
};

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      setAccessToken: (t) => {
        set({ accessToken: t });
      },
      reset: () => {
        set({ accessToken: null });
      },

      _hasHydrated: false,
      _setHasHydrated: (v) => set({ _hasHydrated: v }),
    }),
    {
      name: "auth-store",
      // simpan hanya accessToken
      partialize: (s) => ({ accessToken: s.accessToken }),
      // pakai sessionStorage (bukan localStorage)
      storage: createJSONStorage(() => sessionStorage),
      // tandai kalau sudah rehydrate
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error("[Auth] rehydrate error:", error);
        }
        state?._setHasHydrated(true);
      },
    }
  )
);

// akses sinkron (ingat: sebelum hydrate nilainya bisa null)
export function getAccessTokenSync() {
  return useAuth.getState().accessToken;
}
