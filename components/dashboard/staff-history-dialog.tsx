"use client"

import { useEffect, useMemo, useState } from "react"
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
import { formatDateShort } from "@/lib/utils"
import type { StaffMember } from "./staff-view"

interface StaffHistoryDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    member: StaffMember | null
}

interface AssignmentItem {
    id: string
    staff_member_id: string
    role_id: string
    start_time: string | null
    end_time: string | null
    hours_worked: number | null
    total_pay: number | null
    custom_hourly_rate: number | null
    staff_roles?: { id: string; name: string }
    service: null | {
        title: string
        eventDate: string | null
        eventLocation: string | null
        clientName: string | null
        source: "manual" | "proposal"
    }
}

export function StaffHistoryDialog({ open, onOpenChange, member }: StaffHistoryDialogProps) {
    const [loading, setLoading] = useState(false)
    const [items, setItems] = useState<AssignmentItem[]>([])
    const [drafts, setDrafts] = useState<Record<string, { start: string; end: string }>>({})
    const [savedId, setSavedId] = useState<string | null>(null)

    const loadHistory = async () => {
        if (!member) return
        setLoading(true)
        try {
            const res = await fetch(`/api/staff-assignments?staffId=${member.id}`)
            const data = res.ok ? await res.json() : []
            setItems(data ?? [])
            const nextDrafts: Record<string, { start: string; end: string }> = {}
            ;(data ?? []).forEach((a: AssignmentItem) => {
                nextDrafts[a.id] = {
                    start: timeFromIso(a.start_time),
                    end: timeFromIso(a.end_time),
                }
            })
            setDrafts(nextDrafts)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!open) return
        loadHistory()
    }, [open, member])

    const grouped = useMemo(() => items, [items])

    const handleSave = async (assignment: AssignmentItem) => {
        const draft = drafts[assignment.id]
        const serviceDate = assignment.service?.eventDate || new Date().toISOString().slice(0, 10)
        const start = draft?.start ? buildTimestamp(serviceDate, draft.start) : null
        const end = draft?.end ? buildEndTimestamp(serviceDate, draft?.start ?? null, draft.end) : null

        await fetch(`/api/service-staff/${assignment.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                staffMemberId: assignment.staff_member_id,
                roleId: assignment.role_id,
                startTime: start,
                endTime: end,
                customHourlyRate: assignment.custom_hourly_rate,
            }),
        })

        setSavedId(assignment.id)
        setTimeout(() => setSavedId((prev) => (prev === assignment.id ? null : prev)), 2000)
        loadHistory()
    }

    if (!member) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Histórico de Horas</DialogTitle>
                    <DialogDescription>
                        {member.first_name} {member.last_name}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <p className="text-sm text-muted-foreground">A carregar histórico...</p>
                ) : grouped.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem registos de horas.</p>
                ) : (
                    <div className="space-y-3">
                        {grouped.map((assignment) => (
                            <div key={assignment.id} className="rounded-md border p-3 space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-medium">
                                            {assignment.service?.title || "Serviço"}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {assignment.staff_roles?.name || "Função"}
                                            {assignment.service?.clientName ? ` · ${assignment.service.clientName}` : ""}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {assignment.service?.eventDate
                                                ? formatDateShort(assignment.service.eventDate)
                                                : "—"}
                                            {assignment.service?.eventLocation ? ` · ${assignment.service.eventLocation}` : ""}
                                        </p>
                                    </div>
                                    <div className="text-right text-xs text-muted-foreground">
                                        {assignment.hours_worked != null ? `${assignment.hours_worked.toFixed(2)}h` : "—"}
                                        {assignment.total_pay != null ? ` · ${assignment.total_pay.toFixed(2)}€` : ""}
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2 items-end">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Entrada</Label>
                                        <Input
                                            type="time"
                                            value={drafts[assignment.id]?.start || ""}
                                            onChange={(e) =>
                                                setDrafts((prev) => ({
                                                    ...prev,
                                                    [assignment.id]: {
                                                        ...prev[assignment.id],
                                                        start: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-xs">Saída</Label>
                                            {isNextDay(
                                                drafts[assignment.id]?.start || timeFromIso(assignment.start_time),
                                                drafts[assignment.id]?.end || timeFromIso(assignment.end_time),
                                            ) && (
                                                <span className="text-[10px] text-muted-foreground">+1 dia</span>
                                            )}
                                        </div>
                                        <Input
                                            type="time"
                                            value={drafts[assignment.id]?.end || ""}
                                            onChange={(e) =>
                                                setDrafts((prev) => ({
                                                    ...prev,
                                                    [assignment.id]: {
                                                        ...prev[assignment.id],
                                                        end: e.target.value,
                                                    },
                                                }))
                                            }
                                            className="h-8 text-sm"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <Button
                                            size="sm"
                                            className="h-8 text-xs"
                                            onClick={() => handleSave(assignment)}
                                        >
                                            Guardar
                                        </Button>
                                    </div>
                                </div>

                                {savedId === assignment.id ? (
                                    <div className="flex justify-end text-xs text-emerald-600">Guardado</div>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

function buildTimestamp(date: string, time: string) {
    return `${date}T${time}:00`
}

function buildEndTimestamp(serviceDate: string, startTime: string | null, endTime: string) {
    if (!startTime) return buildTimestamp(serviceDate, endTime)
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    const startMinutes = sh * 60 + sm
    const endMinutes = eh * 60 + em
    const date = new Date(serviceDate + "T00:00:00")
    if (endMinutes < startMinutes) {
        date.setDate(date.getDate() + 1)
    }
    return buildTimestamp(date.toISOString().slice(0, 10), endTime)
}

function isNextDay(startTime?: string | null, endTime?: string | null) {
    if (!startTime || !endTime) return false
    const [sh, sm] = startTime.split(":").map(Number)
    const [eh, em] = endTime.split(":").map(Number)
    if (Number.isNaN(sh) || Number.isNaN(sm) || Number.isNaN(eh) || Number.isNaN(em)) return false
    return eh * 60 + em < sh * 60 + sm
}

function timeFromIso(value: string | null) {
    if (!value) return ""
    const match = value.match(/T(\d{2}):(\d{2})/)
    if (match) return `${match[1]}:${match[2]}`
    const parts = value.split(" ")
    if (parts.length > 1 && parts[1].length >= 5) return parts[1].slice(0, 5)
    return value.slice(0, 5)
}
