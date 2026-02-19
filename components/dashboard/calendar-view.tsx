"use client"

import { useEffect, useState, useCallback } from "react"
import { Calendar } from "@/components/ui/calendar"
import { CalendarEventDialog } from "./calendar-event-dialog"
import { CalendarCreateDialog } from "./calendar-create-dialog"
import { CalendarDays, Plus, ChevronLeft, ChevronRight, MapPin, Users, FileText } from "lucide-react"
import { formatDateShort } from "@/lib/utils"

export interface CalendarEventData {
    id: string
    title: string
    eventDate: string
    eventTime?: string | null
    eventEndDate?: string | null
    clientName: string
    clientEmail?: string | null
    clientPhone?: string | null
    clientCompany?: string | null
    clientNif?: string | null
    eventLocation?: string | null
    guestCount?: number | null
    eventType?: string | null
    notes?: string | null
    status: "confirmed" | "cancelled"
    source: "proposal" | "manual"
    proposalId?: string | null
    referenceNumber?: string | null
    total?: number | null
}

export function CalendarView() {
    const [events, setEvents] = useState<CalendarEventData[]>([])
    const [loading, setLoading] = useState(true)
    const [currentMonth, setCurrentMonth] = useState(new Date())
    const [selectedEvent, setSelectedEvent] = useState<CalendarEventData | null>(null)
    const [showEventDialog, setShowEventDialog] = useState(false)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createDate, setCreateDate] = useState<Date | undefined>(undefined)

    const fetchEvents = useCallback(async () => {
        setLoading(true)
        const start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
        const end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0)
        const startStr = start.toISOString().slice(0, 10)
        const endStr = end.toISOString().slice(0, 10)

        try {
            const res = await fetch(`/api/calendar-events?start=${startStr}&end=${endStr}`)
            if (res.ok) {
                const data = await res.json()
                setEvents(data)
            }
        } catch (err) {
            console.error("Error fetching calendar events:", err)
        } finally {
            setLoading(false)
        }
    }, [currentMonth])

    useEffect(() => {
        fetchEvents()
    }, [fetchEvents])

    // Agrupar eventos por data
    const eventsByDate = events.reduce<Record<string, CalendarEventData[]>>((acc, event) => {
        const key = event.eventDate
        if (!acc[key]) acc[key] = []
        acc[key].push(event)
        return acc
    }, {})

    // Datas que têm eventos (para o DayPicker modifiers)
    const proposalDates = events
        .filter((e) => e.source === "proposal")
        .map((e) => new Date(e.eventDate + "T00:00:00"))
    const manualDates = events
        .filter((e) => e.source === "manual")
        .map((e) => new Date(e.eventDate + "T00:00:00"))

    const handleDayClick = (day: Date) => {
        const dateStr = day.toISOString().slice(0, 10)
        const dayEvents = eventsByDate[dateStr]

        if (dayEvents && dayEvents.length === 1) {
            setSelectedEvent(dayEvents[0])
            setShowEventDialog(true)
        } else if (dayEvents && dayEvents.length > 1) {
            // Se múltiplos eventos, mostra o primeiro (podemos melhorar depois)
            setSelectedEvent(dayEvents[0])
            setShowEventDialog(true)
        } else {
            // Dia vazio → criar novo serviço
            setCreateDate(day)
            setShowCreateDialog(true)
        }
    }

    const handleCreateNew = () => {
        setCreateDate(new Date())
        setShowCreateDialog(true)
    }

    const handleEventCreated = () => {
        setShowCreateDialog(false)
        fetchEvents()
    }

    const handleEventDeleted = () => {
        setShowEventDialog(false)
        setSelectedEvent(null)
        fetchEvents()
    }

    const formatDate = (d: Date) => formatDateShort(d)

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))
    }

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))
    }

    const today = () => {
        setCurrentMonth(new Date())
    }

    // Formatar label do tipo de evento
    const eventTypeLabel = (type: string | null | undefined) => {
        switch (type) {
            case "wedding": return "Casamento"
            case "corporate": return "Corporativo"
            case "private": return "Privado"
            default: return "Evento"
        }
    }

    // Todos os eventos no mês actual, ordenados por data
    const monthEvents = [...events].sort((a, b) => a.eventDate.localeCompare(b.eventDate))

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <CalendarDays className="h-6 w-6" />
                        Calendário
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Visualize os seus serviços e eventos agendados
                    </p>
                </div>
                <button
                    onClick={handleCreateNew}
                    className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Novo Serviço
                </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                {/* Calendário principal */}
                <div className="rounded-xl border bg-white shadow-sm">
                    {/* Nav do mês */}
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <button
                            onClick={prevMonth}
                            className="rounded-md p-2 hover:bg-accent transition-colors"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-semibold capitalize">
                                {formatDate(currentMonth)}
                            </h2>
                            <button
                                onClick={today}
                                className="rounded-md border px-3 py-1 text-xs font-medium hover:bg-accent transition-colors"
                            >
                                Hoje
                            </button>
                        </div>
                        <button
                            onClick={nextMonth}
                            className="rounded-md p-2 hover:bg-accent transition-colors"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Calendar grid */}
                    <div className="p-4">
                        <Calendar
                            mode="single"
                            month={currentMonth}
                            onMonthChange={setCurrentMonth}
                            onDayClick={handleDayClick}
                            modifiers={{
                                proposalEvent: proposalDates,
                                manualEvent: manualDates,
                            }}
                            modifiersClassNames={{
                                proposalEvent: "calendar-proposal-event",
                                manualEvent: "calendar-manual-event",
                            }}
                            showOutsideDays={true}
                            className="w-full [--cell-size:3.5rem] md:[--cell-size:4.5rem]"
                            classNames={{
                                months: "w-full",
                                month: "w-full",
                                month_grid: "w-full",
                                week: "flex w-full",
                                weekday: "flex-1 text-center text-muted-foreground font-medium text-sm py-2",
                                weekdays: "flex w-full",
                                day: "flex-1 relative p-0 text-center",
                                day_button:
                                    "w-full h-[var(--cell-size)] rounded-lg text-sm font-medium hover:bg-accent/50 transition-colors relative",
                                today: "bg-accent text-accent-foreground font-bold",
                                selected: "bg-primary text-primary-foreground",
                                outside: "text-muted-foreground/40",
                                nav: "hidden",
                                month_caption: "hidden",
                            }}
                        />
                    </div>

                    {/* Legenda */}
                    <div className="border-t px-6 py-3 flex items-center gap-6 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                            Orçamento aceite
                        </span>
                        <span className="flex items-center gap-1.5">
                            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                            Serviço manual
                        </span>
                    </div>
                </div>

                {/* Sidebar — próximos eventos do mês */}
                <div className="space-y-4">
                    <div className="rounded-xl border bg-white shadow-sm">
                        <div className="border-b px-5 py-4">
                            <h3 className="font-semibold text-sm">
                                Eventos este mês
                                {!loading && (
                                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                                        ({monthEvents.length})
                                    </span>
                                )}
                            </h3>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="p-5 text-sm text-muted-foreground">A carregar...</div>
                            ) : monthEvents.length === 0 ? (
                                <div className="p-5 text-sm text-muted-foreground">
                                    Sem eventos neste mês.
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {monthEvents.map((event) => (
                                        <button
                                            key={event.id}
                                            onClick={() => {
                                                setSelectedEvent(event)
                                                setShowEventDialog(true)
                                            }}
                                            className="w-full text-left px-5 py-3.5 hover:bg-accent/50 transition-colors"
                                        >
                                            <div className="flex items-start gap-3">
                                                <span
                                                    className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${event.source === "proposal" ? "bg-blue-500" : "bg-emerald-500"
                                                        }`}
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="font-medium text-sm truncate">{event.title}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">
                                                        {formatDateShort(event.eventDate)}
                                                        {event.eventTime && ` · ${event.eventTime.slice(0, 5)}`}
                                                    </p>
                                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                        {event.clientName && (
                                                            <span className="truncate">{event.clientName}</span>
                                                        )}
                                                        {event.guestCount && (
                                                            <span className="flex items-center gap-0.5 shrink-0">
                                                                <Users className="h-3 w-3" />
                                                                {event.guestCount}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                {event.source === "proposal" && (
                                                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">
                                                        Proposta
                                                    </span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            <CalendarEventDialog
                event={selectedEvent}
                open={showEventDialog}
                onOpenChange={setShowEventDialog}
                onDeleted={handleEventDeleted}
            />

            <CalendarCreateDialog
                date={createDate}
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                onCreated={handleEventCreated}
            />
        </div>
    )
}
