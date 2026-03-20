"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Edit2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface StaffMember {
    id: string
    first_name: string
    last_name: string
    roles: { role_id: string; staff_roles: { id: string; name: string } }[]
}

interface StaffRole {
    id: string
    name: string
    is_active?: boolean
}

interface Assignment {
    id: string
    staff_member_id: string
    role_id: string
    notes: string | null
    staff_members: { id: string; first_name: string; last_name: string }
    staff_roles: { id: string; name: string }
}

interface StaffAssignmentPanelProps {
    calendarEventId?: string | null
    proposalId?: string | null
}

export function StaffAssignmentPanel({
    calendarEventId,
    proposalId,
}: StaffAssignmentPanelProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [allStaff, setAllStaff] = useState<StaffMember[]>([])
    const [allRoles, setAllRoles] = useState<StaffRole[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)

    // Form state
    const [selectedStaffId, setSelectedStaffId] = useState("")
    const [selectedRoleId, setSelectedRoleId] = useState("")

    const resetForm = () => {
        setSelectedStaffId("")
        setSelectedRoleId("")
        setEditingId(null)
        setShowAdd(false)
    }

    const fetchAssignments = useCallback(async () => {
        const param = calendarEventId
            ? `eventId=${calendarEventId}`
            : `proposalId=${proposalId}`
        const res = await fetch(`/api/service-staff?${param}`)
        if (res.ok) setAssignments(await res.json())
    }, [calendarEventId, proposalId])

    const fetchStaffData = useCallback(async () => {
        const [membersRes, rolesRes] = await Promise.all([
            fetch("/api/staff-members"),
            fetch("/api/staff-roles"),
        ])
        if (membersRes.ok) {
            const data = await membersRes.json()
            setAllStaff(data.filter((m: StaffMember & { is_active: boolean }) => m.is_active))
        }
        if (rolesRes.ok) setAllRoles(await rolesRes.json())
    }, [])

    useEffect(() => {
        Promise.all([fetchAssignments(), fetchStaffData()]).then(() => setLoading(false))
    }, [fetchAssignments, fetchStaffData])

    useEffect(() => {
        if (selectedStaffId && !editingId) {
            const member = allStaff.find((s) => s.id === selectedStaffId)
            if (member && member.roles.length > 0 && !selectedRoleId) {
                setSelectedRoleId(member.roles[0].role_id)
            }
        }
    }, [selectedStaffId, allStaff, selectedRoleId, editingId])

    const handleAdd = async () => {
        if (!selectedStaffId || !selectedRoleId) return

        await fetch("/api/service-staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                calendarEventId: calendarEventId || null,
                proposalId: proposalId || null,
                staffMemberId: selectedStaffId,
                roleId: selectedRoleId,
            }),
        })

        resetForm()
        fetchAssignments()
    }

    const handleEditClick = (a: Assignment) => {
        setEditingId(a.id)
        setSelectedStaffId(a.staff_member_id)
        setSelectedRoleId(a.role_id)
        setShowAdd(false)
    }

    const handleSaveEdit = async (a: Assignment) => {
        if (!selectedStaffId || !selectedRoleId) return

        await fetch(`/api/service-staff/${a.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                staffMemberId: selectedStaffId,
                roleId: selectedRoleId,
            }),
        })

        resetForm()
        fetchAssignments()
    }

    const handleDelete = async (id: string) => {
        await fetch(`/api/service-staff/${id}`, { method: "DELETE" })
        fetchAssignments()
    }

    if (loading) {
        return <p className="text-sm text-muted-foreground py-2">A carregar equipa...</p>
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm flex items-center gap-2">
                    👥 Equipa ({assignments.length})
                </h4>
                {!showAdd && (
                    <Button size="sm" variant="outline" onClick={() => setShowAdd(true)} className="gap-1 h-7 text-xs">
                        <Plus className="h-3 w-3" /> Adicionar
                    </Button>
                )}
            </div>

            {/* Lista de staff atribuído */}
            {assignments.length > 0 && (
                <div className="space-y-2">
                    {assignments.map((a) => {
                        if (editingId === a.id) {
                            return (
                                <div key={a.id} className="space-y-3 p-3 rounded-md border bg-muted/30">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-semibold">A editar atribuição</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                            <Label className="text-xs">Funcionário</Label>
                                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue placeholder="Selecionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allStaff.map((s) => (
                                                        <SelectItem key={s.id} value={s.id}>
                                                            {s.first_name} {s.last_name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-1">
                                            <Label className="text-xs">Função</Label>
                                            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                                                <SelectTrigger className="h-8 text-sm">
                                                    <SelectValue placeholder="Selecionar..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {allRoles
                                                        .filter((r) => r.is_active || r.id === a.role_id)
                                                        .map((r) => (
                                                            <SelectItem key={r.id} value={r.id}>
                                                                {r.name}
                                                            </SelectItem>
                                                        ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button size="sm" variant="outline" onClick={resetForm} className="h-7 text-xs">Cancelar</Button>
                                        <Button size="sm" onClick={() => handleSaveEdit(a)} disabled={!selectedStaffId || !selectedRoleId} className="h-7 text-xs">Guardar</Button>
                                    </div>
                                </div>
                            )
                        }

                        return (
                            <div key={a.id} className="flex items-center justify-between p-2 rounded-md border text-sm">
                                <div className="flex-1">
                                    <span className="font-medium">{a.staff_members?.first_name} {a.staff_members?.last_name}</span>
                                    <span className="text-muted-foreground ml-2">— {a.staff_roles?.name}</span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleEditClick(a)}>
                                        <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => handleDelete(a.id)}>
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {assignments.length === 0 && !showAdd && (
                <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhum funcionário atribuído a este serviço.
                </p>
            )}

            {/* Formulário para adicionar */}
            {showAdd && (
                <div className="space-y-3 p-3 rounded-md border bg-muted/30">
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs">Funcionário</Label>
                            <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Selecionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allStaff.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>
                                            {s.first_name} {s.last_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">Função</Label>
                            <Select value={selectedRoleId} onValueChange={setSelectedRoleId}>
                                <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Selecionar..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {allRoles
                                        .filter((r) => r.is_active)
                                        .map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAdd(false)}
                            className="h-7 text-xs"
                        >
                            Cancelar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleAdd}
                            disabled={!selectedStaffId || !selectedRoleId}
                            className="h-7 text-xs"
                        >
                            Adicionar
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}
