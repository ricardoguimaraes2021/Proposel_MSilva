"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import { MapPin, Users, Phone, Mail, CalendarDays, FileText, Clock, Trash2, ExternalLink, Ban } from "lucide-react"
import type { CalendarEventData } from "./calendar-view"
import { useState } from "react"
import { formatDateShort } from "@/lib/utils"
import { StaffAssignmentPanel } from "./staff-assignment-panel"

interface CalendarEventDialogProps {
    event: CalendarEventData | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onDeleted?: () => void
}

export function CalendarEventDialog({ event, open, onOpenChange, onDeleted }: CalendarEventDialogProps) {
    const [deleting, setDeleting] = useState(false)

    if (!event) return null

    const eventTypeLabel = (type: string | null | undefined) => {
        switch (type) {
            case "wedding": return "Casamento"
            case "corporate": return "Corporativo"
            case "private": return "Privado"
            default: return "Evento"
        }
    }

    const handleDelete = async () => {
        if (!confirm("Tem a certeza que deseja eliminar este serviço?")) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/calendar-events/${event.id}`, { method: "DELETE" })
            if (res.ok) {
                onDeleted?.()
            }
        } catch (err) {
            console.error("Error deleting event:", err)
        } finally {
            setDeleting(false)
        }
    }

    const handleCancel = async () => {
        if (!confirm("Tem a certeza que deseja cancelar este serviço?")) return
        setDeleting(true)
        try {
            const res = await fetch(`/api/calendar-events/cancel`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    source: event.source,
                    id: event.source === "proposal" ? event.proposalId : event.id,
                }),
            })
            if (res.ok) {
                onDeleted?.()
            }
        } catch (err) {
            console.error("Error cancelling event:", err)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <div className="flex items-start gap-3">
                        <span
                            className={`mt-1 h-3 w-3 shrink-0 rounded-full ${event.source === "proposal" ? "bg-blue-500" : "bg-emerald-500"
                                }`}
                        />
                        <div>
                            <DialogTitle className="text-lg">{event.title}</DialogTitle>
                            <DialogDescription className="flex items-center gap-2 mt-1">
                                <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${event.source === "proposal"
                                    ? "bg-blue-50 text-blue-700"
                                    : "bg-emerald-50 text-emerald-700"
                                    }`}>
                                    {event.source === "proposal" ? "Orçamento aceite" : "Serviço manual"}
                                </span>
                                <span className="text-xs">{eventTypeLabel(event.eventType)}</span>
                            </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-4 mt-2">
                    {/* Data */}
                    <div className="flex items-center gap-3 text-sm">
                        <CalendarDays className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span>{formatDateShort(event.eventDate)}</span>
                    </div>

                    {/* Hora */}
                    {event.eventTime && (
                        <div className="flex items-center gap-3 text-sm">
                            <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{event.eventTime.slice(0, 5)}</span>
                        </div>
                    )}

                    {/* Cliente */}
                    <div className="rounded-lg border bg-accent/30 p-4 space-y-2.5">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cliente</p>
                        <p className="font-medium">{event.clientName}</p>
                        {event.clientEmail && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Mail className="h-3.5 w-3.5" />
                                <a href={`mailto:${event.clientEmail}`} className="hover:underline">
                                    {event.clientEmail}
                                </a>
                            </div>
                        )}
                        {event.clientPhone && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Phone className="h-3.5 w-3.5" />
                                <a href={`tel:${event.clientPhone}`} className="hover:underline">
                                    {event.clientPhone}
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Localização */}
                    {event.eventLocation && (
                        <div className="flex items-center gap-3 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{event.eventLocation}</span>
                        </div>
                    )}

                    {/* Nº pessoas */}
                    {event.guestCount && (
                        <div className="flex items-center gap-3 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                            <span>{event.guestCount} pessoas</span>
                        </div>
                    )}

                    {/* Notas */}
                    {event.notes && (
                        <div className="rounded-lg border p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">Notas</p>
                            <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
                        </div>
                    )}

                    {/* Link para proposta (se aplicável) */}
                    {event.source === "proposal" && event.proposalId && (
                        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-blue-700 mb-1">Orçamento associado</p>
                                    <p className="text-sm font-medium">
                                        {event.referenceNumber || "Ver proposta"}
                                    </p>
                                    {event.total != null && (
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Total: {new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(event.total)}
                                        </p>
                                    )}
                                </div>
                                <a
                                    href={`/dashboard/proposals?highlight=${event.proposalId}`}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Ver proposta
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Gestão de Staff */}
                    <div className="pt-4 border-t">
                        <StaffAssignmentPanel
                            calendarEventId={event.source === "manual" ? event.id : null}
                            proposalId={event.source === "proposal" && event.proposalId ? event.proposalId : null}
                            serviceDate={event.eventDate}
                            showTimeFields={false}
                        />
                    </div>
                </div>

                {/* Ações */}
                <div className="flex justify-end mt-4 pt-4 border-t">
                    <button
                        onClick={handleCancel}
                        disabled={deleting}
                        className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-50"
                    >
                        <Ban className="h-3 w-3" />
                        {deleting ? "A cancelar..." : "Cancelar serviço"}
                    </button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
