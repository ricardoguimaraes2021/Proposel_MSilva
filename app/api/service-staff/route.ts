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

    // Calcular horas e pagamento
    let hoursWorked: number | null = null
    let totalPay: number | null = null

    if (body.startTime && body.endTime) {
        const start = new Date(body.startTime)
        let end = new Date(body.endTime)
        if (end.getTime() < start.getTime()) {
            end = new Date(end.getTime() + 24 * 60 * 60 * 1000)
        }
        hoursWorked = Math.round(((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * 100) / 100
    }

    // Determinar rate: override serviço → override funcionário → default role
    let effectiveRate = body.customHourlyRate

    if (effectiveRate == null && body.staffMemberId && body.roleId) {
        // Buscar override do funcionário para esta role
        const { data: memberRole } = await supabase
            .from("staff_member_roles")
            .select("custom_hourly_rate")
            .eq("staff_member_id", body.staffMemberId)
            .eq("role_id", body.roleId)
            .single()

        if (memberRole?.custom_hourly_rate != null) {
            effectiveRate = memberRole.custom_hourly_rate
        } else {
            // Buscar default da role
            const { data: role } = await supabase
                .from("staff_roles")
                .select("default_hourly_rate")
                .eq("id", body.roleId)
                .single()

            effectiveRate = role?.default_hourly_rate ?? 0
        }
    }

    if (hoursWorked != null && effectiveRate != null) {
        totalPay = Math.round(hoursWorked * effectiveRate * 100) / 100
    }

    const { data, error } = await supabase
        .from("service_staff_assignments")
        .insert({
            calendar_event_id: body.calendarEventId || null,
            proposal_id: body.proposalId || null,
            staff_member_id: body.staffMemberId,
            role_id: body.roleId,
            start_time: body.startTime || null,
            end_time: body.endTime || null,
            custom_hourly_rate: body.customHourlyRate ?? null,
            hours_worked: hoursWorked,
            total_pay: totalPay,
            notes: body.notes || null,
        })
        .select("*, staff_members(*), staff_roles(*)")
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
