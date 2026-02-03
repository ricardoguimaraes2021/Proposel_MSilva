import { createClient } from "@/lib/supabase/server"
import { ClientsTable, type ClientRow } from "@/components/dashboard/clients-table"
import { ClientDialog } from "@/components/dashboard/client-dialog"

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching clients:", error)
    return <div>Erro ao carregar clientes.</div>
  }

  const rows: ClientRow[] = (clients ?? []).map((c) => ({
    id: c.id,
    name: c.name ?? "",
    email: c.email ?? null,
    phone: c.phone ?? null,
    company: c.company ?? null,
    nif: c.nif ?? null,
    address_street: c.address_street ?? null,
    address_city: c.address_city ?? null,
    address_postal_code: c.address_postal_code ?? null,
    address_country: c.address_country ?? null,
    notes: c.notes ?? null,
    created_at: c.created_at,
    updated_at: c.updated_at,
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <ClientDialog />
      </div>
      <p className="text-muted-foreground text-sm">
        Registe clientes recorrentes ou empresas para os selecionar ao criar um orçamento. Inclua NIF para faturação.
      </p>
      <ClientsTable clients={rows} />
    </div>
  )
}
