import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    const { data, error } = await supabase
        .from("calendar_events")
        .update({
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
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", id)

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
}
