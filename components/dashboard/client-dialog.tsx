"use client"

import { useState } from "react"
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
import { PlusCircle } from "lucide-react"
import { useRouter } from "next/navigation"

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

const emptyForm: ClientFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  nif: "",
  address_street: "",
  address_city: "",
  address_postal_code: "",
  address_country: "Portugal",
  notes: "",
}

export function ClientDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<ClientFormValues>(emptyForm)
  const router = useRouter()

  const handleChange = (field: keyof ClientFormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("Nome é obrigatório.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/clients", {
        method: "POST",
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
        throw new Error(typeof err?.error === "string" ? err.error : "Falha ao criar cliente.")
      }

      setOpen(false)
      setForm(emptyForm)
      router.refresh()
    } catch (e) {
      console.error(e)
      setError(e instanceof Error ? e.message : "Falha ao criar cliente.")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) {
      setError(null)
      setForm(emptyForm)
    }
    setOpen(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
          <DialogDescription>
            Registe um cliente para poder selecioná-lo ao criar orçamentos. Inclua NIF para faturação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome *</Label>
            <Input id="name" value={form.name} onChange={handleChange("name")} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={form.email} onChange={handleChange("email")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input id="phone" value={form.phone} onChange={handleChange("phone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company">Empresa</Label>
              <Input id="company" value={form.company} onChange={handleChange("company")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="nif">NIF</Label>
              <Input id="nif" value={form.nif} onChange={handleChange("nif")} placeholder="Para faturação" />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address_street">Morada</Label>
            <Input id="address_street" value={form.address_street} onChange={handleChange("address_street")} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="address_postal_code">Código Postal</Label>
              <Input id="address_postal_code" value={form.address_postal_code} onChange={handleChange("address_postal_code")} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address_city">Localidade</Label>
              <Input id="address_city" value={form.address_city} onChange={handleChange("address_city")} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address_country">País</Label>
            <Input id="address_country" value={form.address_country} onChange={handleChange("address_country")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" value={form.notes} onChange={handleChange("notes")} rows={2} />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "A guardar..." : "Criar Cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
