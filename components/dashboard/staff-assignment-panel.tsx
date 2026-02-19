"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Trash2, Clock, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
    roles: { role_id: string; custom_hourly_rate: number | null; staff_roles: { id: string; name: string; default_hourly_rate: number } }[]
}

interface StaffRole {
    id: string
    name: string
    default_hourly_rate: number
    is_active?: boolean
}

interface Assignment {
    id: string
    staff_member_id: string
    role_id: string
    start_time: string | null
    end_time: string | null
    custom_hourly_rate: number | null
    hours_worked: number | null
    total_pay: number | null
    notes: string | null
    staff_members: { id: string; first_name: string; last_name: string }
    staff_roles: { id: string; name: string }
}

interface StaffAssignmentPanelProps {
    calendarEventId?: string | null
    proposalId?: string | null
    serviceDate?: string | null
    showTimeFields?: boolean
}

export function StaffAssignmentPanel({
    calendarEventId,
    proposalId,
    serviceDate,
    showTimeFields = true,
}: StaffAssignmentPanelProps) {
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [allStaff, setAllStaff] = useState<StaffMember[]>([])
    const [allRoles, setAllRoles] = useState<StaffRole[]>([])
    const [loading, setLoading] = useState(true)
    const [showAdd, setShowAdd] = useState(false)

    // Form state para nova atribuição
    const [selectedStaffId, setSelectedStaffId] = useState("")
    const [selectedRoleId, setSelectedRoleId] = useState("")
    const [startTime, setStartTime] = useState("")
    const [endTime, setEndTime] = useState("")
    const [customRate, setCustomRate] = useState("")

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

    // Quando seleciona um staff, auto-selecionar a primeira role do staff se tiver
    useEffect(() => {
        if (selectedStaffId) {
            const member = allStaff.find((s) => s.id === selectedStaffId)
            if (member && member.roles.length > 0 && !selectedRoleId) {
                setSelectedRoleId(member.roles[0].role_id)
            }
        }
    }, [selectedStaffId, allStaff, selectedRoleId])

    const buildTimestamp = (time: string) => {
        if (!time || !serviceDate) return null
        return `${serviceDate}T${time}:00`
    }

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
                startTime: buildTimestamp(startTime),
                endTime: buildTimestamp(endTime),
                customHourlyRate: customRate ? parseFloat(customRate) : null,
            }),
        })

        setSelectedStaffId("")
        setSelectedRoleId("")
        setStartTime("")
        setEndTime("")
        setCustomRate("")
        setShowAdd(false)
        fetchAssignments()
    }

    const handleDelete = async (id: string) => {
        await fetch(`/api/service-staff/${id}`, { method: "DELETE" })
        fetchAssignments()
    }

    const totalHours = assignments.reduce((s, a) => s + (Number(a.hours_worked) || 0), 0)
    const totalPay = assignments.reduce((s, a) => s + (Number(a.total_pay) || 0), 0)

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
                    {assignments.map((a) => (
                        <div
                            key={a.id}
                            className="flex items-center justify-between p-2 rounded-md border text-sm"
                        >
                            <div className="flex-1">
                                <span className="font-medium">
                                    {a.staff_members?.first_name} {a.staff_members?.last_name}
                                </span>
                                <span className="text-muted-foreground ml-2">— {a.staff_roles?.name}</span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                {showTimeFields && a.start_time && a.end_time && (
                                    <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(a.start_time).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                                        –
                                        {new Date(a.end_time).toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                                        <span className="font-mono">({a.hours_worked ?? 0}h)</span>
                                    </span>
                                )}
                                {showTimeFields && a.total_pay != null && (
                                    <span className="flex items-center gap-1 font-mono">
                                        <DollarSign className="h-3 w-3" />
                                        {Number(a.total_pay).toFixed(2)}€
                                    </span>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={() => handleDelete(a.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Totais */}
                    {showTimeFields && assignments.length > 0 && (totalHours > 0 || totalPay > 0) && (
                        <div className="flex justify-end gap-4 text-xs font-medium pt-1 border-t">
                            <span>Total: {totalHours.toFixed(1)}h</span>
                            <span>{totalPay.toFixed(2)}€</span>
                        </div>
                    )}
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
                                                {r.name} ({r.default_hourly_rate}€/h)
                                            </SelectItem>
                                        ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {showTimeFields && (
                        <div className="grid grid-cols-3 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs">Entrada</Label>
                                <Input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Saída</Label>
                                <Input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">€/h (override)</Label>
                                <Input
                                    type="number"
                                    step="0.5"
                                    value={customRate}
                                    onChange={(e) => setCustomRate(e.target.value)}
                                    className="h-8 text-sm"
                                    placeholder="—"
                                />
                            </div>
                        </div>
                    )}

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
