import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get("eventId")
    const proposalId = searchParams.get("proposalId")

    let query = supabase
        .from("service_staff_assignments")
        .select("*, staff_members(*), staff_roles(*)")

    if (eventId) query = query.eq("calendar_event_id", eventId)
    if (proposalId) query = query.eq("proposal_id", proposalId)

    const { data, error } = await query.order("created_at", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
        .from("service_staff_assignments")
        .insert({
            calendar_event_id: body.calendarEventId || null,
            proposal_id: body.proposalId || null,
            staff_member_id: body.staffMemberId,
            role_id: body.roleId,
            notes: body.notes || null,
        })
        .select("*, staff_members(*), staff_roles(*)")
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
