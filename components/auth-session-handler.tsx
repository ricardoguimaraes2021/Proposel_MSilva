"use client";

import { createClient } from "@/lib/supabase/client";
import { isRefreshTokenInvalidError } from "@/lib/supabase/auth-errors";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Limpa sessão corrupta (ex.: refresh token em falta) para evitar AuthApiError em loop na consola.
 */
export function AuthSessionHandler() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    const clearIfInvalid = async (error: unknown) => {
      if (!isRefreshTokenInvalidError(error)) return;
      await supabase.auth.signOut({ scope: "local" });
      router.refresh();
    };

    void supabase.auth.getSession().then(({ error }) => {
      void clearIfInvalid(error);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" && !session) {
        router.refresh();
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  return null;
}
