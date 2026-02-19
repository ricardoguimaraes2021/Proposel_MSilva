"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Clock, User, CalendarDays, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatDateShort } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface StaffRole {
    id: string
    name: string
    default_hourly_rate: number
    is_active?: boolean
}

interface StaffMemberRole {
    id: string
    role_id: string
    custom_hourly_rate: number | null
    staff_roles: StaffRole
}

interface StaffMember {
    id: string
    first_name: string
    last_name: string
    is_active: boolean
    roles: StaffMemberRole[]
}

interface CalendarEventData {
    id: string
    title: string
    eventDate: string
    eventTime?: string | null
    clientName: string
    clientCompany?: string | null
    clientNif?: string | null
    eventLocation?: string | null
    eventType?: string | null
    source: "proposal" | "manual"
    proposalId?: string | null
}

interface Assignment {
    id: string
    calendar_event_id: string | null
    proposal_id: string | null
    staff_member_id: string
    role_id: string
    start_time: string | null
    end_time: string | null
    custom_hourly_rate: number | null
    hours_worked: number | null
    total_pay: number | null
    staff_members: { id: string; first_name: string; last_name: string }
    staff_roles: { id: string; name: string }
}

interface AssignmentTimeDraft {
    start: string
    end: string
}

export function StaffClockView() {
    const [members, setMembers] = useState<StaffMember[]>([])
    const [roles, setRoles] = useState<StaffRole[]>([])
    const [events, setEvents] = useState<CalendarEventData[]>([])
    const [assignments, setAssignments] = useState<Assignment[]>([])
    const [loading, setLoading] = useState(true)

    const [timeDrafts, setTimeDrafts] = useState<Record<string, AssignmentTimeDraft>>({})
    const [assigningFor, setAssigningFor] = useState<string | null>(null)
    const [selectedServiceByStaff, setSelectedServiceByStaff] = useState<Record<string, string>>({})
    const [selectedRoleByStaff, setSelectedRoleByStaff] = useState<Record<string, string>>({})
    const [selectedStaffByService, setSelectedStaffByService] = useState<Record<string, string>>({})
    const [selectedRoleByService, setSelectedRoleByService] = useState<Record<string, string>>({})
    const [savedAssignmentId, setSavedAssignmentId] = useState<string | null>(null)
    const [upcomingByStaff, setUpcomingByStaff] = useState<Record<string, {
        id: string
        title: string
        eventDate: string
        clientName: string | null
    }[]>>({})
    const [search, setSearch] = useState("")

    const fetchMembers = useCallback(async () => {
        const res = await fetch("/api/staff-members")
        if (res.ok) {
            const data = await res.json()
            setMembers(data.filter((m: StaffMember) => m.is_active))
        }
    }, [])

    const fetchRoles = useCallback(async () => {
        const res = await fetch("/api/staff-roles")
        if (res.ok) setRoles(await res.json())
    }, [])

    const fetchEvents = useCallback(async () => {
        const res = await fetch("/api/calendar-events")
        if (res.ok) setEvents(await res.json())
    }, [])

    const fetchAssignments = useCallback(async () => {
        const res = await fetch("/api/service-staff")
        if (res.ok) {
            setAssignments(await res.json())
        }
    }, [])

    const fetchUpcoming = useCallback(async () => {
        const res = await fetch("/api/staff-upcoming")
        if (res.ok) {
            setUpcomingByStaff(await res.json())
        }
    }, [])

    useEffect(() => {
        setLoading(true)
        Promise.all([fetchMembers(), fetchRoles(), fetchEvents(), fetchAssignments(), fetchUpcoming()])
            .then(() => setLoading(false))
    }, [fetchMembers, fetchRoles, fetchEvents, fetchAssignments, fetchUpcoming])

    useEffect(() => {
        const drafts: Record<string, AssignmentTimeDraft> = {}
        assignments.forEach((a) => {
            drafts[a.id] = {
                start: timeFromIso(a.start_time),
                end: timeFromIso(a.end_time),
            }
        })
        setTimeDrafts(drafts)
    }, [assignments])

    const eventsByKey = useMemo(() => {
        const map = new Map<string, CalendarEventData>()
        events.forEach((e) => {
            const key = eventKey(e)
            map.set(key, e)
        })
        return map
    }, [events])

    const assignmentsByStaff = useMemo(() => {
        return assignments.reduce<Record<string, Assignment[]>>((acc, a) => {
            if (!acc[a.staff_member_id]) acc[a.staff_member_id] = []
            acc[a.staff_member_id].push(a)
            return acc
        }, {})
    }, [assignments])

    const assignedServiceKeys = useMemo(() => {
        return new Set(assignments.map((a) => assignmentKey(a)))
    }, [assignments])

    const unassignedServices = useMemo(() => {
        const today = getTodayLocal()
        return events.filter(
            (e) => !assignedServiceKeys.has(eventKey(e)) && e.eventDate === today
        )
    }, [events, assignedServiceKeys])

    const activeRoles = roles.filter((r) => r.is_active !== false)
    const normalizedSearch = search.trim().toLowerCase()
    const filteredMembers = normalizedSearch
        ? members.filter((m) => {
            const name = `${m.first_name} ${m.last_name}`.toLowerCase()
            const phone = (m.phone ?? "").toLowerCase()
            const nif = (m.nif ?? "").toLowerCase()
            return name.includes(normalizedSearch) || phone.includes(normalizedSearch) || nif.includes(normalizedSearch)
        })
        : members

    const handleSaveTimes = async (assignment: Assignment) => {
        const draft = timeDrafts[assignment.id]
        const serviceDate = getAssignmentDate(assignment, eventsByKey)
        const start = draft?.start ? buildTimestamp(serviceDate, draft.start) : null
        const end = draft?.end
            ? buildEndTimestamp(serviceDate, draft?.start ?? null, draft.end)
            : null

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
        setSavedAssignmentId(assignment.id)
        setTimeout(() => setSavedAssignmentId((prev) => (prev === assignment.id ? null : prev)), 2000)
        fetchAssignments()
    }

    const handleClockIn = async (assignment: Assignment) => {
        const now = new Date()
        const time = now.toTimeString().slice(0, 5)
        const serviceDate = getAssignmentDate(assignment, eventsByKey)
        setTimeDrafts((prev) => ({
            ...prev,
            [assignment.id]: { ...prev[assignment.id], start: time },
        }))
        await fetch(`/api/service-staff/${assignment.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                staffMemberId: assignment.staff_member_id,
                roleId: assignment.role_id,
                startTime: buildTimestamp(serviceDate, time),
                endTime: assignment.end_time,
                customHourlyRate: assignment.custom_hourly_rate,
            }),
        })
        setSavedAssignmentId(assignment.id)
        setTimeout(() => setSavedAssignmentId((prev) => (prev === assignment.id ? null : prev)), 2000)
        fetchAssignments()
    }

    const handleClockOut = async (assignment: Assignment) => {
        const now = new Date()
        const time = now.toTimeString().slice(0, 5)
        const serviceDate = getAssignmentDate(assignment, eventsByKey)
        const startTime = timeFromIso(assignment.start_time)
        setTimeDrafts((prev) => ({
            ...prev,
            [assignment.id]: { ...prev[assignment.id], end: time },
        }))
        await fetch(`/api/service-staff/${assignment.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                staffMemberId: assignment.staff_member_id,
                roleId: assignment.role_id,
                startTime: assignment.start_time,
                endTime: buildEndTimestamp(serviceDate, startTime || null, time),
                customHourlyRate: assignment.custom_hourly_rate,
            }),
        })
        setSavedAssignmentId(assignment.id)
        setTimeout(() => setSavedAssignmentId((prev) => (prev === assignment.id ? null : prev)), 2000)
        fetchAssignments()
    }

    const handleAssignService = async (staff: StaffMember) => {
        const serviceValue = selectedServiceByStaff[staff.id]
        const roleId = selectedRoleByStaff[staff.id] || staff.roles?.[0]?.role_id

        if (!serviceValue || !roleId) return

        const [source, id] = serviceValue.split(":")

        await fetch("/api/service-staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                calendarEventId: source === "manual" ? id : null,
                proposalId: source === "proposal" ? id : null,
                staffMemberId: staff.id,
                roleId,
            }),
        })

        setAssigningFor(null)
        setSelectedServiceByStaff((prev) => ({ ...prev, [staff.id]: "" }))
        setSelectedRoleByStaff((prev) => ({ ...prev, [staff.id]: "" }))
        fetchAssignments()
    }

    const handleAssignFromService = async (service: CalendarEventData) => {
        const serviceKey = eventKey(service)
        const staffId = selectedStaffByService[serviceKey]
        const roleId = selectedRoleByService[serviceKey]

        if (!staffId || !roleId) return

        await fetch("/api/service-staff", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                calendarEventId: service.source === "manual" ? service.id : null,
                proposalId: service.source === "proposal" ? (service.proposalId ?? service.id) : null,
                staffMemberId: staffId,
                roleId,
            }),
        })

        setSelectedStaffByService((prev) => ({ ...prev, [serviceKey]: "" }))
        setSelectedRoleByService((prev) => ({ ...prev, [serviceKey]: "" }))
        fetchAssignments()
    }

    if (loading) {
        return <p className="text-sm text-muted-foreground">A carregar relógio de ponto...</p>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Clock className="h-6 w-6" /> Clock In/Out
                    </h1>
                    <p className="text-muted-foreground">
                        Registar horas de trabalho e atribuir staff a serviços passados ou futuros.
                    </p>
                </div>
            </div>

            <div>
                <Input
                    placeholder="Pesquisar funcionário..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            {members.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Sem funcionários ativos.</p>
            ) : (
                <div className="grid gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Serviços sem staff</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {unassignedServices.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    Todos os serviços já têm staff atribuído.
                                </p>
                            ) : (
                                unassignedServices.map((service) => {
                                    const serviceKey = eventKey(service)
                                    return (
                                        <div key={serviceKey} className="rounded-md border p-3 space-y-2">
                                            <div>
                                                <p className="text-sm font-medium">
                                                    {service.title} — {service.clientName}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {service.source === "proposal" ? "Proposta aceite" : "Serviço manual"}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatDateShort(service.eventDate)}
                                                    {service.eventLocation ? ` · ${service.eventLocation}` : ""}
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Funcionário</Label>
                                                    <Select
                                                        value={selectedStaffByService[serviceKey] || ""}
                                                        onValueChange={(value) =>
                                                            setSelectedStaffByService((prev) => ({
                                                                ...prev,
                                                                [serviceKey]: value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Selecionar..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {members.map((m) => (
                                                                <SelectItem key={m.id} value={m.id}>
                                                                    {m.first_name} {m.last_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Função</Label>
                                                    <Select
                                                        value={selectedRoleByService[serviceKey] || ""}
                                                        onValueChange={(value) =>
                                                            setSelectedRoleByService((prev) => ({
                                                                ...prev,
                                                                [serviceKey]: value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Selecionar..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {activeRoles.map((role) => (
                                                                <SelectItem key={role.id} value={role.id}>
                                                                    {role.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end">
                                                <Button
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => handleAssignFromService(service)}
                                                    disabled={!selectedStaffByService[serviceKey] || !selectedRoleByService[serviceKey]}
                                                >
                                                    Atribuir
                                                </Button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </CardContent>
                    </Card>
                    {filteredMembers.map((staff) => {
                        const today = getTodayLocal()
                        const staffAssignments = (assignmentsByStaff[staff.id] ?? []).filter((a) => {
                            if (a.start_time && a.end_time) return false
                            const event = eventsByKey.get(assignmentKey(a))
                            const serviceDate = event?.eventDate
                            if (!serviceDate) return true
                            if (a.start_time && !a.end_time) return true
                            return serviceDate === today
                        })

                        return (
                            <Card key={staff.id}>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="flex items-center gap-2 text-base">
                                        <User className="h-4 w-4" />
                                        {staff.first_name} {staff.last_name}
                                    </CardTitle>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => setAssigningFor(staff.id)}
                                        className="gap-1"
                                    >
                                        <Plus className="h-3.5 w-3.5" /> Atribuir serviço
                                    </Button>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {(() => {
                                        const upcoming = upcomingByStaff[staff.id] ?? []
                                        if (upcoming.length === 0) return null
                                        return (
                                            <div className="rounded-md border bg-muted/30 p-3">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                    Próximos serviços
                                                </p>
                                                <div className="mt-2 space-y-1">
                                                    {upcoming.slice(0, 3).map((s) => (
                                                        <div key={s.id} className="text-xs">
                                                            <span className="font-medium">{formatDateShort(s.eventDate)}</span>
                                                            <span className="text-muted-foreground"> · {s.title}</span>
                                                            {s.clientName ? (
                                                                <span className="text-muted-foreground"> · {s.clientName}</span>
                                                            ) : null}
                                                        </div>
                                                    ))}
                                                    {upcoming.length > 3 ? (
                                                        <span className="text-xs text-muted-foreground">
                                                            +{upcoming.length - 3} mais
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        )
                                    })()}
                                    {assigningFor === staff.id && (
                                        <div className="rounded-md border bg-muted/30 p-3 space-y-3">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Serviço</Label>
                                                    <Select
                                                        value={selectedServiceByStaff[staff.id] || ""}
                                                        onValueChange={(value) =>
                                                            setSelectedServiceByStaff((prev) => ({
                                                                ...prev,
                                                                [staff.id]: value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Selecionar..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {events.map((event) => (
                                                                <SelectItem
                                                                    key={eventKey(event)}
                                                                    value={eventKey(event)}
                                                                >
                                                                    {event.title} — {event.clientName}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="text-xs">Função</Label>
                                                    <Select
                                                        value={selectedRoleByStaff[staff.id] || staff.roles?.[0]?.role_id || ""}
                                                        onValueChange={(value) =>
                                                            setSelectedRoleByStaff((prev) => ({
                                                                ...prev,
                                                                [staff.id]: value,
                                                            }))
                                                        }
                                                    >
                                                        <SelectTrigger className="h-8 text-sm">
                                                            <SelectValue placeholder="Selecionar..." />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {activeRoles.map((role) => (
                                                                <SelectItem key={role.id} value={role.id}>
                                                                    {role.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setAssigningFor(null)}
                                                    className="h-7 text-xs"
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    disabled={!selectedServiceByStaff[staff.id] || !(selectedRoleByStaff[staff.id] || staff.roles?.[0]?.role_id)}
                                                    onClick={() => handleAssignService(staff)}
                                                >
                                                    Atribuir
                                                </Button>
                                            </div>
                                        </div>
                                    )}

                                    {staffAssignments.length === 0 ? (
                                        <p className="text-sm text-muted-foreground">Sem serviços pendentes.</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {staffAssignments.map((assignment) => {
                                                const event = eventsByKey.get(assignmentKey(assignment))
                                                const label = event
                                                    ? `${event.title} — ${event.clientName}`
                                                    : "Serviço"
                                                const serviceDate = event?.eventDate
                                                const canClockIn = !serviceDate || serviceDate === getTodayLocal()
                                                const canClockOut = !serviceDate || serviceDate <= getTodayLocal()

                                                return (
                                                    <div key={assignment.id} className="rounded-md border p-3 space-y-2">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <p className="text-sm font-medium">{label}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {assignment.staff_roles?.name}
                                                                </p>
                                                            </div>
                                                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                                                <CalendarDays className="h-3 w-3" />
                                                                {event?.eventDate ? formatDateShort(event.eventDate) : "—"}
                                                            </span>
                                                        </div>

                                                        <div className="grid grid-cols-3 gap-2 items-end">
                                                            <div className="space-y-1">
                                                                <Label className="text-xs">Entrada</Label>
                                                                <Input
                                                                    type="time"
                                                                    value={timeDrafts[assignment.id]?.start || ""}
                                                                    onChange={(e) =>
                                                                        setTimeDrafts((prev) => ({
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
                                                                        timeDrafts[assignment.id]?.start || timeFromIso(assignment.start_time),
                                                                        timeDrafts[assignment.id]?.end || timeFromIso(assignment.end_time),
                                                                    ) && (
                                                                        <span className="text-[10px] text-muted-foreground">+1 dia</span>
                                                                    )}
                                                                </div>
                                                                <Input
                                                                    type="time"
                                                                    value={timeDrafts[assignment.id]?.end || ""}
                                                                    onChange={(e) =>
                                                                        setTimeDrafts((prev) => ({
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
                                                                {!assignment.start_time && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 text-xs"
                                                                        onClick={() => handleClockIn(assignment)}
                                                                        disabled={!canClockIn}
                                                                        title={!canClockIn ? "Só pode fazer clock in a partir da data do serviço." : undefined}
                                                                    >
                                                                        Clock In
                                                                    </Button>
                                                                )}
                                                                {assignment.start_time && !assignment.end_time && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 text-xs"
                                                                        onClick={() => handleClockOut(assignment)}
                                                                        disabled={!canClockOut}
                                                                    >
                                                                        Clock Out
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    size="sm"
                                                                    className="h-8 text-xs"
                                                                    onClick={() => handleSaveTimes(assignment)}
                                                                >
                                                                    Guardar
                                                                </Button>
                                                            </div>
                                                        </div>

                                                        <div className="flex justify-between text-xs text-muted-foreground">
                                                            {assignment.hours_worked != null ? (
                                                                <span>{Number(assignment.hours_worked).toFixed(2)}h</span>
                                                            ) : (
                                                                <span />
                                                            )}
                                                            {savedAssignmentId === assignment.id ? (
                                                                <span className="text-emerald-600 font-medium">Guardado</span>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function buildTimestamp(date: string, time: string) {
    return `${date}T${time}:00`
}

function getTodayLocal() {
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const local = new Date(now.getTime() - offset * 60 * 1000)
    return local.toISOString().slice(0, 10)
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
    // Evitar drift de timezone: extrair HH:MM diretamente da string ISO
    const match = value.match(/T(\d{2}):(\d{2})/)
    if (match) return `${match[1]}:${match[2]}`
    const parts = value.split(" ")
    if (parts.length > 1 && parts[1].length >= 5) return parts[1].slice(0, 5)
    return value.slice(0, 5)
}

function eventKey(event: CalendarEventData) {
    if (event.source === "proposal") return `proposal:${event.proposalId ?? event.id}`
    return `manual:${event.id}`
}

function assignmentKey(assignment: Assignment) {
    if (assignment.proposal_id) return `proposal:${assignment.proposal_id}`
    if (assignment.calendar_event_id) return `manual:${assignment.calendar_event_id}`
    return "unknown"
}

function getAssignmentDate(assignment: Assignment, eventsByKey: Map<string, CalendarEventData>) {
    const event = eventsByKey.get(assignmentKey(assignment))
    if (event?.eventDate) return event.eventDate
    return new Date().toISOString().slice(0, 10)
}
