"use client"

import { useState } from "react"
import { Plus, Edit, Trash2, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { StaffRole } from "./staff-view"

interface StaffRolesSectionProps {
    roles: StaffRole[]
    onRolesChanged: () => void
}

export function StaffRolesSection({ roles, onRolesChanged }: StaffRolesSectionProps) {
    const [creating, setCreating] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [newName, setNewName] = useState("")
    const [newRate, setNewRate] = useState("")
    const [editName, setEditName] = useState("")
    const [editRate, setEditRate] = useState("")

    const handleCreate = async () => {
        if (!newName.trim()) return
        await fetch("/api/staff-roles", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newName.trim(),
                defaultHourlyRate: parseFloat(newRate) || 0,
            }),
        })
        setNewName("")
        setNewRate("")
        setCreating(false)
        onRolesChanged()
    }

    const handleStartEdit = (role: StaffRole) => {
        setEditingId(role.id)
        setEditName(role.name)
        setEditRate(role.default_hourly_rate.toString())
    }

    const handleSaveEdit = async () => {
        if (!editingId || !editName.trim()) return
        await fetch(`/api/staff-roles/${editingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: editName.trim(),
                defaultHourlyRate: parseFloat(editRate) || 0,
            }),
        })
        setEditingId(null)
        onRolesChanged()
    }

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Desativar a função "${name}"?`)) return
        await fetch(`/api/staff-roles/${id}`, { method: "DELETE" })
        onRolesChanged()
    }

    const activeRoles = roles.filter((r) => r.is_active)
    const inactiveRoles = roles.filter((r) => !r.is_active)

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Funções / Cargos</CardTitle>
                {!creating && (
                    <Button onClick={() => setCreating(true)} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Nova Função
                    </Button>
                )}
            </CardHeader>
            <CardContent className="space-y-3">
                {/* Nova função */}
                {creating && (
                    <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/30">
                        <Input
                            placeholder="Nome da função"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="flex-1"
                            autoFocus
                        />
                        <Input
                            type="number"
                            step="0.5"
                            placeholder="€/hora"
                            value={newRate}
                            onChange={(e) => setNewRate(e.target.value)}
                            className="w-28"
                        />
                        <Button size="icon" onClick={handleCreate} disabled={!newName.trim()}>
                            <Save className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setCreating(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                {/* Lista de funções ativas */}
                {activeRoles.length === 0 && !creating && (
                    <p className="text-center text-muted-foreground py-8">
                        Nenhuma função criada. Comece por adicionar funções como &quot;Copa&quot;, &quot;Cozinha&quot;, &quot;Sala&quot;, &quot;Bar&quot;.
                    </p>
                )}

                {activeRoles.map((role) => (
                    <div
                        key={role.id}
                        className="flex items-center gap-3 p-3 rounded-md border hover:bg-muted/30 transition-colors"
                    >
                        {editingId === role.id ? (
                            <>
                                <Input
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="flex-1"
                                    autoFocus
                                />
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={editRate}
                                    onChange={(e) => setEditRate(e.target.value)}
                                    className="w-28"
                                />
                                <Button size="icon" onClick={handleSaveEdit}>
                                    <Save className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>
                                    <X className="h-4 w-4" />
                                </Button>
                            </>
                        ) : (
                            <>
                                <div className="flex-1">
                                    <span className="font-medium">{role.name}</span>
                                </div>
                                <span className="text-sm text-muted-foreground font-mono">
                                    {role.default_hourly_rate}€/h
                                </span>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => handleStartEdit(role)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(role.id, role.name)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </>
                        )}
                    </div>
                ))}

                {/* Funções inativas */}
                {inactiveRoles.length > 0 && (
                    <div className="pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">
                            Funções desativadas ({inactiveRoles.length})
                        </p>
                        {inactiveRoles.map((role) => (
                            <div
                                key={role.id}
                                className="flex items-center gap-3 p-2 rounded-md opacity-50"
                            >
                                <span className="flex-1 line-through">{role.name}</span>
                                <span className="text-sm font-mono">{role.default_hourly_rate}€/h</span>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
