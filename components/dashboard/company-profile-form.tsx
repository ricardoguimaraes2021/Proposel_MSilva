"use client"

import { useState, type ChangeEvent, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sanitizePhoneInput } from "@/lib/utils"

export type CompanyProfileFormValues = {
  id?: string
  name: string
  tagline_pt: string
  tagline_en: string
  logo_url: string
  contact_phone: string
  contact_email: string
  contact_website: string
  contact_instagram: string
  contact_facebook: string
  address_street: string
  address_city: string
  address_postal_code: string
  address_country: string
}

const defaultValues: CompanyProfileFormValues = {
  id: undefined,
  name: "MSilva",
  tagline_pt: "Catering & Eventos",
  tagline_en: "Catering & Events",
  logo_url: "",
  contact_phone: "",
  contact_email: "",
  contact_website: "",
  contact_instagram: "",
  contact_facebook: "",
  address_street: "",
  address_city: "",
  address_postal_code: "",
  address_country: "Portugal",
}

const emptyToNull = (value: string) => {
  const trimmed = value.trim()
  return trimmed.length === 0 ? null : trimmed
}

export function CompanyProfileForm({ initialData }: { initialData?: CompanyProfileFormValues | null }) {
  const router = useRouter()
  const [formData, setFormData] = useState<CompanyProfileFormValues>(() => ({
    ...defaultValues,
    ...initialData,
  }))
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleChange = (field: keyof CompanyProfileFormValues) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value
      setFormData((prev) => ({ ...prev, [field]: value }))
    }

  const handleDigits = (field: keyof CompanyProfileFormValues, maxLength: number) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = sanitizePhoneInput(event.target.value, maxLength)
      setFormData((prev) => ({ ...prev, [field]: next }))
    }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setMessage(null)

    const payload = {
      id: formData.id || undefined,
      name: formData.name.trim() || "MSilva",
      tagline_pt: emptyToNull(formData.tagline_pt),
      tagline_en: emptyToNull(formData.tagline_en),
      logo_url: emptyToNull(formData.logo_url),
      contact_phone: emptyToNull(formData.contact_phone),
      contact_email: emptyToNull(formData.contact_email),
      contact_website: emptyToNull(formData.contact_website),
      contact_instagram: emptyToNull(formData.contact_instagram),
      contact_facebook: emptyToNull(formData.contact_facebook),
      address_street: emptyToNull(formData.address_street),
      address_city: emptyToNull(formData.address_city),
      address_postal_code: emptyToNull(formData.address_postal_code),
      address_country: emptyToNull(formData.address_country) ?? "Portugal",
    }

    try {
      const response = await fetch("/api/company-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error("Falha ao guardar o perfil da empresa.")
      }

      const saved = await response.json()
      setFormData((prev) => ({ ...prev, id: saved?.id ?? prev.id }))
      setMessage("Perfil atualizado com sucesso.")
      router.refresh()
    } catch (error) {
      console.error(error)
      setMessage("Nao foi possivel guardar. Tente novamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Identidade</CardTitle>
          <CardDescription>Defina o nome comercial e o logotipo.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" value={formData.name} onChange={handleChange("name")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="logo_url">Logo (URL)</Label>
            <Input id="logo_url" value={formData.logo_url} onChange={handleChange("logo_url")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tagline_pt">Tagline (PT)</Label>
            <Input id="tagline_pt" value={formData.tagline_pt} onChange={handleChange("tagline_pt")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tagline_en">Tagline (EN)</Label>
            <Input id="tagline_en" value={formData.tagline_en} onChange={handleChange("tagline_en")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contacto</CardTitle>
          <CardDescription>Informacao usada na proposta e rodape.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="contact_phone">Telefone</Label>
            <Input
              id="contact_phone"
              value={formData.contact_phone}
              onChange={handleDigits("contact_phone", 15)}
              inputMode="tel"
              pattern="\\+?[0-9]*"
              maxLength={16}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact_email">Email</Label>
            <Input id="contact_email" value={formData.contact_email} onChange={handleChange("contact_email")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact_website">Website</Label>
            <Input id="contact_website" value={formData.contact_website} onChange={handleChange("contact_website")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact_instagram">Instagram</Label>
            <Input id="contact_instagram" value={formData.contact_instagram} onChange={handleChange("contact_instagram")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="contact_facebook">Facebook</Label>
            <Input id="contact_facebook" value={formData.contact_facebook} onChange={handleChange("contact_facebook")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Morada</CardTitle>
          <CardDescription>Localizacao da empresa para referencias legais.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="address_street">Rua</Label>
            <Input id="address_street" value={formData.address_street} onChange={handleChange("address_street")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address_city">Cidade</Label>
            <Input id="address_city" value={formData.address_city} onChange={handleChange("address_city")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address_postal_code">Codigo Postal</Label>
            <Input id="address_postal_code" value={formData.address_postal_code} onChange={handleChange("address_postal_code")} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="address_country">Pais</Label>
            <Input id="address_country" value={formData.address_country} onChange={handleChange("address_country")} />
          </div>
        </CardContent>
      </Card>

      <CardFooter className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{message}</p>
        <Button type="submit" disabled={saving}>
          {saving ? "A guardar..." : "Guardar alteracoes"}
        </Button>
      </CardFooter>
    </form>
  )
}
