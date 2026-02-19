import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get("start")
    const endDate = searchParams.get("end")

    // Buscar eventos manuais do calendário
    let manualQuery = supabase
        .from("calendar_events")
        .select("*")
        .eq("status", "confirmed")

    if (startDate) manualQuery = manualQuery.gte("event_date", startDate)
    if (endDate) manualQuery = manualQuery.lte("event_date", endDate)

    const { data: manualEvents, error: manualError } = await manualQuery

    if (manualError) {
        return NextResponse.json({ error: manualError.message }, { status: 500 })
    }

    // Buscar propostas aceites com data de evento
    let proposalQuery = supabase
        .from("proposals")
        .select("id,reference_number,client_name,client_email,client_phone,event_type,event_type_custom_pt,event_title,event_date,event_location,guest_count,event_notes,status,total,subtotal")
        .eq("status", "accepted")
        .not("event_date", "is", null)

    if (startDate) proposalQuery = proposalQuery.gte("event_date", startDate)
    if (endDate) proposalQuery = proposalQuery.lte("event_date", endDate)

    const { data: proposals, error: proposalsError } = await proposalQuery

    if (proposalsError) {
        return NextResponse.json({ error: proposalsError.message }, { status: 500 })
    }

    // Normalizar ambos para o mesmo formato
    const calendarEvents = [
        ...(manualEvents ?? []).map((e) => ({
            id: e.id,
            title: e.title,
            eventDate: e.event_date,
            eventTime: e.event_time,
            eventEndDate: e.event_end_date,
            clientName: e.client_name,
            clientEmail: e.client_email,
            clientPhone: e.client_phone,
            clientCompany: e.client_company,
            clientNif: e.client_nif,
            eventLocation: e.event_location,
            guestCount: e.guest_count,
            eventType: e.event_type,
            notes: e.notes,
            status: e.status as "confirmed" | "cancelled",
            source: "manual" as const,
        })),
        ...(proposals ?? []).map((p) => ({
            id: p.id,
            title: p.event_title || eventTypeLabel(p),
            eventDate: p.event_date,
            eventTime: null,
            eventEndDate: null,
            clientName: p.client_name,
            clientEmail: p.client_email,
            clientPhone: p.client_phone,
            eventLocation: p.event_location,
            guestCount: p.guest_count,
            eventType: p.event_type,
            notes: p.event_notes,
            status: "confirmed" as const,
            source: "proposal" as const,
            proposalId: p.id,
            referenceNumber: p.reference_number,
            total: p.total ?? p.subtotal,
        })),
    ]

    return NextResponse.json(calendarEvents)
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

export async function POST(request: Request) {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
        .from("calendar_events")
        .insert({
            title: body.title,
            event_date: body.eventDate,
            event_time: body.eventTime || null,
            event_end_date: body.eventEndDate || null,
            client_name: body.clientName,
            client_email: body.clientEmail || null,
            client_phone: body.clientPhone || null,
            client_company: body.clientCompany || null,
            client_nif: body.clientNif || null,
            event_location: body.eventLocation || null,
            guest_count: body.guestCount || null,
            event_type: body.eventType || "other",
            notes: body.notes || null,
            status: "confirmed",
        })
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}
