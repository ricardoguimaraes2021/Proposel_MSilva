import { isAuthApiError } from "@supabase/auth-js";

/** Erros de refresh inválido/em falta — limpar cookies evita loops e erros na consola. */
export function isRefreshTokenInvalidError(error: unknown): boolean {
  if (error == null || typeof error !== "object") return false;

  const msg = String((error as Error).message ?? "").toLowerCase();
  if (
    msg.includes("refresh token") &&
    (msg.includes("not found") || msg.includes("invalid"))
  ) {
    return true;
  }

  if (isAuthApiError(error)) {
    const code = (error as { code?: string }).code;
    if (
      code === "refresh_token_not_found" ||
      code === "invalid_refresh_token"
    ) {
      return true;
    }
  }

  return false;
}
