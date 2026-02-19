"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { sanitizePhoneInput, validatePortugueseNif } from "@/lib/utils"

interface CalendarCreateDialogProps {
    date?: Date
    open: boolean
    onOpenChange: (open: boolean) => void
    onCreated: () => void
}

type ClientOption = {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
    nif: string | null
    address_street?: string | null
    address_city?: string | null
    address_postal_code?: string | null
    address_country?: string | null
}

function formatClientAddress(c: ClientOption): string {
    const parts = [
        c.address_street?.trim(),
        [c.address_postal_code?.trim(), c.address_city?.trim()].filter(Boolean).join(" "),
        c.address_country?.trim(),
    ].filter(Boolean)
    return parts.length ? parts.join(", ") : ""
}

export function CalendarCreateDialog({ date, open, onOpenChange, onCreated }: CalendarCreateDialogProps) {
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [clients, setClients] = useState<ClientOption[]>([])
    const [selectedClientId, setSelectedClientId] = useState("")
    const [clientSearch, setClientSearch] = useState("")
    const [form, setForm] = useState({
        title: "",
        eventDate: "",
        eventTime: "",
        clientName: "",
        clientEmail: "",
        clientPhone: "",
        clientCompany: "",
        clientNif: "",
        eventLocation: "",
        guestCount: "",
        eventType: "other",
        notes: "",
    })

    // Atualizar a data quando o dialog abre com uma data nova
    const dateStr = date ? date.toISOString().slice(0, 10) : ""

    useEffect(() => {
        if (!open) return
        fetch("/api/clients")
            .then((res) => (res.ok ? res.json() : []))
            .then((data) => setClients(data ?? []))
            .catch(() => {})
    }, [open])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (form.clientNif.trim() && !validatePortugueseNif(form.clientNif)) {
            setError("NIF inválido.")
            return
        }
        setSaving(true)

        try {
            const res = await fetch("/api/calendar-events", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: form.title,
                    eventDate: form.eventDate || dateStr,
                    eventTime: form.eventTime || null,
                    clientName: form.clientName,
                    clientEmail: form.clientEmail || null,
                    clientPhone: form.clientPhone || null,
                    clientCompany: form.clientCompany || null,
                    clientNif: form.clientNif || null,
                    eventLocation: form.eventLocation || null,
                    guestCount: form.guestCount ? parseInt(form.guestCount) : null,
                    eventType: form.eventType,
                    notes: form.notes || null,
                }),
            })

            if (res.ok) {
                setForm({
                    title: "",
                    eventDate: "",
                    eventTime: "",
                    clientName: "",
                    clientEmail: "",
                    clientPhone: "",
                    clientCompany: "",
                    clientNif: "",
                    eventLocation: "",
                    guestCount: "",
                    eventType: "other",
                    notes: "",
                })
                setSelectedClientId("")
                setClientSearch("")
                setError(null)
                onCreated()
            }
        } catch (err) {
            console.error("Error creating event:", err)
        } finally {
            setSaving(false)
        }
    }

    const inputClass =
        "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    const labelClass = "text-sm font-medium text-foreground"

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Novo Serviço</DialogTitle>
                    <DialogDescription>
                        Criar um serviço diretamente no calendário.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Título */}
                    <div className="space-y-1.5">
                        <label htmlFor="title" className={labelClass}>
                            Título do serviço <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="title"
                            name="title"
                            value={form.title}
                            onChange={handleChange}
                            required
                            placeholder="Ex: Casamento Silva & Costa"
                            className={inputClass}
                        />
                    </div>

                    {/* Data e Hora */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="eventDate" className={labelClass}>
                                Data <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="eventDate"
                                name="eventDate"
                                type="date"
                                value={form.eventDate || dateStr}
                                onChange={handleChange}
                                required
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="eventTime" className={labelClass}>
                                Hora
                            </label>
                            <input
                                id="eventTime"
                                name="eventTime"
                                type="time"
                                value={form.eventTime}
                                onChange={handleChange}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Tipo de evento */}
                    <div className="space-y-1.5">
                        <label htmlFor="eventType" className={labelClass}>
                            Tipo de evento
                        </label>
                        <select
                            id="eventType"
                            name="eventType"
                            value={form.eventType}
                            onChange={handleChange}
                            className={inputClass}
                        >
                            <option value="wedding">Casamento</option>
                            <option value="corporate">Corporativo</option>
                            <option value="private">Privado</option>
                            <option value="other">Outro</option>
                        </select>
                    </div>

                    {/* Cliente */}
                    <div className="space-y-1.5">
                        <label htmlFor="clientName" className={labelClass}>
                            Cliente <span className="text-red-500">*</span>
                        </label>
                        {clients.length > 0 && (
                            <>
                                <input
                                    id="clientSearch"
                                    value={clientSearch}
                                    onChange={(e) => setClientSearch(e.target.value)}
                                    placeholder="Pesquisar cliente..."
                                    className={inputClass + " mb-2"}
                                />
                                <select
                                    id="clientSelect"
                                    value={selectedClientId}
                                    onChange={(e) => {
                                        const id = e.target.value
                                        setSelectedClientId(id)
                                        if (id) {
                                            const c = clients.find((x) => x.id === id)
                                            if (c) {
                                                setForm((prev) => ({
                                                    ...prev,
                                                    clientName: c.name,
                                                    clientEmail: c.email ?? "",
                                                    clientPhone: c.phone ?? "",
                                                    clientCompany: c.company ?? "",
                                                    clientNif: c.nif ?? "",
                                                    eventLocation: prev.eventLocation || formatClientAddress(c),
                                                }))
                                            }
                                        } else {
                                            setForm((prev) => ({
                                                ...prev,
                                                clientName: "",
                                                clientEmail: "",
                                                clientPhone: "",
                                                clientCompany: "",
                                                clientNif: "",
                                            }))
                                        }
                                    }}
                                    className={inputClass + " mb-2"}
                                >
                                    <option value="">— Selecionar cliente existente —</option>
                                    {clients
                                        .filter((c) => {
                                            const q = clientSearch.trim().toLowerCase()
                                            if (!q) return true
                                            const label = `${c.name} ${c.company ?? ""}`.toLowerCase()
                                            return label.includes(q)
                                        })
                                        .map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.company ? `${c.name} (${c.company})` : c.name}
                                            </option>
                                        ))}
                                </select>
                            </>
                        )}
                        <input
                            id="clientName"
                            name="clientName"
                            value={form.clientName}
                            onChange={handleChange}
                            required
                            placeholder="Nome do cliente"
                            className={inputClass}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="clientEmail" className={labelClass}>
                                Email
                            </label>
                            <input
                                id="clientEmail"
                                name="clientEmail"
                                type="email"
                                value={form.clientEmail}
                                onChange={handleChange}
                                placeholder="email@exemplo.pt"
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="clientPhone" className={labelClass}>
                                Telefone
                            </label>
                            <input
                                id="clientPhone"
                                name="clientPhone"
                                value={form.clientPhone}
                                onChange={(e) => setForm((prev) => ({ ...prev, clientPhone: sanitizePhoneInput(e.target.value, 15) }))}
                                placeholder="+351 912 345 678"
                                className={inputClass}
                                inputMode="tel"
                                pattern="\\+?[0-9]*"
                                maxLength={16}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="clientCompany" className={labelClass}>
                                Empresa
                            </label>
                            <input
                                id="clientCompany"
                                name="clientCompany"
                                value={form.clientCompany}
                                onChange={handleChange}
                                placeholder="Empresa (opcional)"
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="clientNif" className={labelClass}>
                                NIF
                            </label>
                            <input
                                id="clientNif"
                                name="clientNif"
                                value={form.clientNif}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        clientNif: e.target.value.replace(/\D/g, "").slice(0, 9),
                                    }))
                                }
                                placeholder="NIF (opcional)"
                                className={inputClass}
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={9}
                            />
                        </div>
                    </div>

                    {/* Localização e Nº pessoas */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label htmlFor="eventLocation" className={labelClass}>
                                Localização
                            </label>
                            <input
                                id="eventLocation"
                                name="eventLocation"
                                value={form.eventLocation}
                                onChange={handleChange}
                                placeholder="Ex: Quinta da Serra"
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label htmlFor="guestCount" className={labelClass}>
                                Nº de pessoas
                            </label>
                            <input
                                id="guestCount"
                                name="guestCount"
                                type="number"
                                min="1"
                                value={form.guestCount}
                                onChange={handleChange}
                                placeholder="150"
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-1.5">
                        <label htmlFor="notes" className={labelClass}>
                            Notas
                        </label>
                        <textarea
                            id="notes"
                            name="notes"
                            value={form.notes}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Detalhes adicionais sobre o serviço..."
                            className={inputClass + " resize-none"}
                        />
                    </div>

                    {/* Botões */}
                    {error ? <p className="text-sm text-destructive">{error}</p> : null}
                    <div className="flex justify-end gap-2 pt-2">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={saving}
                            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                        >
                            {saving ? "A guardar..." : "Criar serviço"}
                        </button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
