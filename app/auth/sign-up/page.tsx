import { redirect } from "next/navigation";

/**
 * Registo desativado — ferramenta interna.
 * Contas criadas apenas via Supabase pelo administrador.
 */
export default function Page() {
  redirect("/auth/login");
}
