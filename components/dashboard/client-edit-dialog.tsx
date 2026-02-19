"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"
import type { ClientRow } from "@/components/dashboard/clients-table"
import { sanitizePhoneInput, validatePortugueseNif } from "@/lib/utils"

type ClientFormValues = {
  name: string
  email: string
  phone: string
  company: string
  nif: string
  address_street: string
  address_city: string
  address_postal_code: string
  address_country: string
  notes: string
}

export function ClientEditDialog({ client }: { client: ClientRow }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ClientFormValues>({
    name: client.name,
    email: client.email ?? "",
    phone: client.phone ?? "",
    company: client.company ?? "",
    nif: client.nif ?? "",
    address_street: client.address_street ?? "",
    address_city: client.address_city ?? "",
    address_postal_code: client.address_postal_code ?? "",
    address_country: client.address_country ?? "Portugal",
    notes: client.notes ?? "",
  })
  const router = useRouter()

  useEffect(() => {
    if (open) {
      setForm({
        name: client.name,
        email: client.email ?? "",
        phone: client.phone ?? "",
        company: client.company ?? "",
        nif: client.nif ?? "",
        address_street: client.address_street ?? "",
        address_city: client.address_city ?? "",
        address_postal_code: client.address_postal_code ?? "",
        address_country: client.address_country ?? "Portugal",
        notes: client.notes ?? "",
      })
      setError(null)
    }
  }, [client, open])

  const handleChange = (field: keyof ClientFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const handleDigits = (field: keyof ClientFormValues, maxLength: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const next = sanitizePhoneInput(e.target.value, maxLength)
      setForm((prev) => ({ ...prev, [field]: next }))
    }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("Nome é obrigatório.")
      return
    }
    if (form.nif.trim() && !validatePortugueseNif(form.nif)) {
      setError("NIF inválido.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/clients/${client.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          phone: form.phone.trim() || null,
          company: form.company.trim() || null,
          nif: form.nif.trim() || null,
          address_street: form.address_street.trim() || null,
          address_city: form.address_city.trim() || null,
          address_postal_code: form.address_postal_code.trim() || null,
          address_country: form.address_country.trim() || null,
          notes: form.notes.trim() || null,
        }),
        credentials: "include",
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(typeof err?.error === "string" ? err.error : "Falha ao atualizar cliente.")
      }

      setOpen(false)
      router.refresh()
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : "Falha ao atualizar cliente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Cliente</DialogTitle>
          <DialogDescription>
            Altere os dados do cliente. O NIF é usado para faturação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-name">Nome *</Label>
            <Input id="edit-name" value={form.name} onChange={handleChange("name")} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input id="edit-email" type="email" value={form.email} onChange={handleChange("email")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-phone">Telefone</Label>
              <Input
                id="edit-phone"
                value={form.phone}
                onChange={handleDigits("phone", 15)}
                inputMode="tel"
                pattern="\\+?[0-9]*"
                maxLength={16}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-company">Empresa</Label>
              <Input id="edit-company" value={form.company} onChange={handleChange("company")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-nif">NIF</Label>
              <Input
                id="edit-nif"
                value={form.nif}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    nif: e.target.value.replace(/\D/g, "").slice(0, 9),
                  }))
                }
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={9}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-address_street">Morada</Label>
            <Input id="edit-address_street" value={form.address_street} onChange={handleChange("address_street")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-address_postal_code">Código Postal</Label>
              <Input id="edit-address_postal_code" value={form.address_postal_code} onChange={handleChange("address_postal_code")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-address_city">Localidade</Label>
              <Input id="edit-address_city" value={form.address_city} onChange={handleChange("address_city")} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-address_country">País</Label>
            <Input id="edit-address_country" value={form.address_country} onChange={handleChange("address_country")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Notas</Label>
            <Textarea id="edit-notes" value={form.notes} onChange={handleChange("notes")} rows={2} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
