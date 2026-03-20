"use client"

import { useEffect, useMemo, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
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

    const loadHistory = async () => {
        if (!member) return
        setLoading(true)
        try {
            const res = await fetch(`/api/staff-assignments?staffId=${member.id}`)
            const data = res.ok ? await res.json() : []
            setItems(data ?? [])
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (!open) return
        loadHistory()
    }, [open, member])

    const grouped = useMemo(() => items, [items])

    if (!member) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Histórico de Serviços</DialogTitle>
                    <DialogDescription>
                        {member.first_name} {member.last_name}
                    </DialogDescription>
                </DialogHeader>

                {loading ? (
                    <p className="text-sm text-muted-foreground">A carregar histórico...</p>
                ) : grouped.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem registos de serviços.</p>
                ) : (
                    <div className="space-y-3">
                        {grouped.map((assignment) => (
                            <div key={assignment.id} className="rounded-md border p-3">
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
                                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                        assignment.service?.source === "proposal"
                                            ? "bg-blue-50 text-blue-700"
                                            : "bg-emerald-50 text-emerald-700"
                                    }`}>
                                        {assignment.service?.source === "proposal" ? "Proposta" : "Manual"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}
