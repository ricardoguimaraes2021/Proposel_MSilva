import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get("staffId")

    if (!staffId) {
        return NextResponse.json({ error: "staffId parameter required" }, { status: 400 })
    }

    const { data: assignments, error } = await supabase
        .from("service_staff_assignments")
        .select("*, staff_roles(*)")
        .eq("staff_member_id", staffId)
        .order("created_at", { ascending: false })

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
                .select("id,title,event_date,event_location,client_name,event_type")
                .in("id", manualIds)
            : Promise.resolve({ data: [], error: null } as any),
        proposalIds.length
            ? supabase
                .from("proposals")
                .select("id,event_title,event_type,event_type_custom_pt,event_date,event_location,client_name")
                .in("id", proposalIds)
            : Promise.resolve({ data: [], error: null } as any),
    ])

    if (manualRes.error) return NextResponse.json({ error: manualRes.error.message }, { status: 500 })
    if (proposalRes.error) return NextResponse.json({ error: proposalRes.error.message }, { status: 500 })

    const manualMap = new Map((manualRes.data ?? []).map((e: any) => [e.id, e]))
    const proposalMap = new Map((proposalRes.data ?? []).map((p: any) => [p.id, p]))

    const result = (assignments ?? []).map((a: any) => {
        let service = null as null | {
            title: string
            eventDate: string | null
            eventLocation: string | null
            clientName: string | null
            source: "manual" | "proposal"
        }

        if (a.calendar_event_id) {
            const e = manualMap.get(a.calendar_event_id)
            if (e) {
                service = {
                    title: e.title,
                    eventDate: e.event_date,
                    eventLocation: e.event_location,
                    clientName: e.client_name,
                    source: "manual",
                }
            }
        } else if (a.proposal_id) {
            const p = proposalMap.get(a.proposal_id)
            if (p) {
                service = {
                    title: p.event_title || eventTypeLabel(p),
                    eventDate: p.event_date,
                    eventLocation: p.event_location,
                    clientName: p.client_name,
                    source: "proposal",
                }
            }
        }

        return { ...a, service }
    })

    return NextResponse.json(result)
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
