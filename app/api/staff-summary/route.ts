import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month") // "2026-02"

    if (!month) {
        return NextResponse.json({ error: "month parameter required (YYYY-MM)" }, { status: 400 })
    }

    const [year, monthNum] = month.split("-").map(Number)
    const startDate = new Date(year, monthNum - 1, 1)
    const endDate = new Date(year, monthNum, 0, 23, 59, 59)

    const { data: assignments, error } = await supabase
        .from("service_staff_assignments")
        .select("*, staff_members(id, first_name, last_name), staff_roles(id, name)")
        .gte("start_time", startDate.toISOString())
        .lte("start_time", endDate.toISOString())

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const manualIds = (assignments ?? [])
        .map((a) => a.calendar_event_id)
        .filter(Boolean) as string[]
    const proposalIds = (assignments ?? [])
        .map((a) => a.proposal_id)
        .filter(Boolean) as string[]

    const [manualRes, proposalRes] = await Promise.all([
        manualIds.length
            ? supabase
                .from("calendar_events")
                .select("id,title,event_date")
                .in("id", manualIds)
            : Promise.resolve({ data: [], error: null } as any),
        proposalIds.length
            ? supabase
                .from("proposals")
                .select("id,event_title,event_type,event_type_custom_pt,event_date")
                .in("id", proposalIds)
            : Promise.resolve({ data: [], error: null } as any),
    ])

    if (manualRes.error) return NextResponse.json({ error: manualRes.error.message }, { status: 500 })
    if (proposalRes.error) return NextResponse.json({ error: proposalRes.error.message }, { status: 500 })

    const manualMap = new Map((manualRes.data ?? []).map((e: any) => [e.id, e]))
    const proposalMap = new Map((proposalRes.data ?? []).map((p: any) => [p.id, p]))

    // Agrupar por funcionário
    const byStaff = (assignments ?? []).reduce<Record<string, {
        staffId: string
        name: string
        totalHours: number
        totalPay: number
        services: {
            id: string
            role: string
            hoursWorked: number | null
            totalPay: number | null
            startTime: string | null
            endTime: string | null
            title: string | null
            eventDate: string | null
        }[]
    }>>((acc, a) => {
        const staffId = a.staff_member_id
        if (!acc[staffId]) {
            acc[staffId] = {
                staffId,
                name: `${a.staff_members?.first_name ?? ""} ${a.staff_members?.last_name ?? ""}`.trim(),
                totalHours: 0,
                totalPay: 0,
                services: [],
            }
        }
        acc[staffId].totalHours += Number(a.hours_worked ?? 0)
        acc[staffId].totalPay += Number(a.total_pay ?? 0)
        let title: string | null = null
        let eventDate: string | null = null
        if (a.calendar_event_id) {
            const e = manualMap.get(a.calendar_event_id)
            if (e) {
                title = e.title ?? null
                eventDate = e.event_date ?? null
            }
        } else if (a.proposal_id) {
            const p = proposalMap.get(a.proposal_id)
            if (p) {
                title = p.event_title || eventTypeLabel(p)
                eventDate = p.event_date ?? null
            }
        }

        acc[staffId].services.push({
            id: a.id,
            role: a.staff_roles?.name ?? "",
            hoursWorked: a.hours_worked,
            totalPay: a.total_pay,
            startTime: a.start_time,
            endTime: a.end_time,
            title,
            eventDate,
        })
        return acc
    }, {})

    const summary = Object.values(byStaff).sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({
        month,
        staffCount: summary.length,
        totalHours: summary.reduce((s, x) => s + x.totalHours, 0),
        totalPay: summary.reduce((s, x) => s + x.totalPay, 0),
        staff: summary,
    })
}

function eventTypeLabel(p: { event_type: string; event_type_custom_pt?: string | null }) {
    if (p.event_type_custom_pt) return p.event_type_custom_pt
    switch (p.event_type) {
        case "wedding": return "Casamento"
        case "corporate": return "Evento Corporativo"
        case "private": return "Evento Privado"
        default: return "Evento"
    }
}
