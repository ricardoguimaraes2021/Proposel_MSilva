"use client"

import { useState, useEffect } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import type { StaffMember, StaffRole } from "./staff-view"
import { validatePortugueseNif, sanitizePhoneInput } from "@/lib/utils"

interface StaffMemberDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: StaffMember | null
    availableRoles: StaffRole[]
    onSaved: () => void
}

interface RoleSelection {
    roleId: string
    selected: boolean
    customHourlyRate: string
}

export function StaffMemberDialog({
    open,
    onOpenChange,
    member,
    availableRoles,
    onSaved,
}: StaffMemberDialogProps) {
    const isEdit = !!member

    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [phone, setPhone] = useState("")
    const [nif, setNif] = useState("")
    const [notes, setNotes] = useState("")
    const [roleSelections, setRoleSelections] = useState<RoleSelection[]>([])
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (open) {
            if (member) {
                setFirstName(member.first_name)
                setLastName(member.last_name)
                setPhone(member.phone ?? "")
                setNif(member.nif ?? "")
                setNotes(member.notes ?? "")
                setRoleSelections(
                    availableRoles.map((role) => {
                        const mr = member.roles.find((r) => r.role_id === role.id)
                        return {
                            roleId: role.id,
                            selected: !!mr,
                            customHourlyRate: mr?.custom_hourly_rate?.toString() ?? "",
                        }
                    })
                )
            } else {
                setFirstName("")
                setLastName("")
                setPhone("")
                setNif("")
                setNotes("")
                setRoleSelections(
                    availableRoles.map((role) => ({
                        roleId: role.id,
                        selected: false,
                        customHourlyRate: "",
                    }))
                )
            }
        }
    }, [open, member, availableRoles])

    const toggleRole = (roleId: string) => {
        setRoleSelections((prev) =>
            prev.map((r) => (r.roleId === roleId ? { ...r, selected: !r.selected } : r))
        )
    }

    const setRoleRate = (roleId: string, rate: string) => {
        setRoleSelections((prev) =>
            prev.map((r) => (r.roleId === roleId ? { ...r, customHourlyRate: rate } : r))
        )
    }

    const handleSave = async () => {
        if (!firstName.trim() || !lastName.trim()) return
        if (nif.trim() && !validatePortugueseNif(nif)) {
            setError("NIF inválido.")
            return
        }
        setError(null)
        setSaving(true)

        const selectedRoles = roleSelections
            .filter((r) => r.selected)
            .map((r) => ({
                roleId: r.roleId,
                customHourlyRate: r.customHourlyRate ? parseFloat(r.customHourlyRate) : null,
            }))

        const payload = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            nif: nif.trim(),
            notes: notes.trim(),
            roles: selectedRoles,
        }

        const url = isEdit ? `/api/staff-members/${member.id}` : "/api/staff-members"
        const method = isEdit ? "PUT" : "POST"

        const res = await fetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })

        setSaving(false)

        if (res.ok) {
            onSaved()
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? "Editar Funcionário" : "Novo Funcionário"}
                    </DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? "Atualizar os dados do funcionário."
                            : "Preencha os dados do novo funcionário."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Nome */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">Primeiro Nome *</Label>
                            <Input
                                id="firstName"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="Maria"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">Apelido *</Label>
                            <Input
                                id="lastName"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Silva"
                            />
                        </div>
                    </div>

                    {/* Contacto */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                            <Label htmlFor="phone">Telefone</Label>
                            <Input
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(sanitizePhoneInput(e.target.value, 15))}
                                inputMode="tel"
                                pattern="\\+?[0-9]*"
                                maxLength={16}
                                placeholder="+351 912 345 678"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nif">NIF</Label>
                            <Input
                                id="nif"
                                value={nif}
                                onChange={(e) =>
                                    setNif(e.target.value.replace(/\D/g, "").slice(0, 9))
                                }
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength={9}
                                placeholder="123456789"
                            />
                        </div>
                    </div>

                    {/* Funções */}
                    <div className="space-y-3">
                        <Label>Funções</Label>
                        <div className="space-y-2 rounded-md border p-3">
                            {availableRoles.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    Nenhuma função criada. Crie primeiro na tab &quot;Funções&quot;.
                                </p>
                            )}
                            {availableRoles.map((role) => {
                                const sel = roleSelections.find((r) => r.roleId === role.id)
                                return (
                                    <div key={role.id} className="flex items-center gap-3">
                                        <Checkbox
                                            id={`role-${role.id}`}
                                            checked={sel?.selected ?? false}
                                            onCheckedChange={() => toggleRole(role.id)}
                                        />
                                        <label
                                            htmlFor={`role-${role.id}`}
                                            className="flex-1 text-sm cursor-pointer"
                                        >
                                            {role.name}
                                            <span className="text-muted-foreground ml-1">
                                                (default: {role.default_hourly_rate}€/h)
                                            </span>
                                        </label>
                                        {sel?.selected && (
                                            <Input
                                                type="number"
                                                step="0.5"
                                                placeholder="€/h custom"
                                                className="w-28 h-8 text-sm"
                                                value={sel.customHourlyRate}
                                                onChange={(e) => setRoleRate(role.id, e.target.value)}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* Notas */}
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Observações sobre o funcionário..."
                            rows={2}
                        />
                    </div>

                    {error ? <p className="text-sm text-destructive">{error}</p> : null}

                    {/* Ações */}
                    <div className="flex justify-end gap-2 pt-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving || !firstName.trim() || !lastName.trim()}>
                            {saving ? "A guardar..." : isEdit ? "Guardar" : "Criar"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
