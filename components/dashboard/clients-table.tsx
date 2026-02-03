"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { ClientEditDialog } from "@/components/dashboard/client-edit-dialog"
import { useRouter } from "next/navigation"

export type ClientRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  nif: string | null
  address_street: string | null
  address_city: string | null
  address_postal_code: string | null
  address_country: string | null
  notes: string | null
  created_at?: string
  updated_at?: string
}

interface ClientsTableProps {
  clients: ClientRow[]
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const router = useRouter()

  const handleDelete = async (clientId: string) => {
    const confirmed = window.confirm("Tem a certeza que pretende eliminar este cliente?")
    if (!confirmed) return

    try {
      const response = await fetch(`/api/clients/${clientId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Falha ao eliminar cliente.")
      router.refresh()
    } catch (error) {
      console.error(error)
      window.alert("Não foi possível eliminar o cliente.")
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Empresa</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>NIF</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhum cliente registado. Use &quot;Novo Cliente&quot; para adicionar.
              </TableCell>
            </TableRow>
          ) : (
            clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                <TableCell>{client.company ?? "—"}</TableCell>
                <TableCell>{client.email ?? "—"}</TableCell>
                <TableCell>{client.phone ?? "—"}</TableCell>
                <TableCell>{client.nif ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <ClientEditDialog client={client} />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(client.id)}
                      className="text-white hover:text-white"
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
