import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Recalcular horas e pagamento
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

    // Determinar rate
    let effectiveRate = body.customHourlyRate

    if (effectiveRate == null && body.staffMemberId && body.roleId) {
        const { data: memberRole } = await supabase
            .from("staff_member_roles")
            .select("custom_hourly_rate")
            .eq("staff_member_id", body.staffMemberId)
            .eq("role_id", body.roleId)
            .single()

        if (memberRole?.custom_hourly_rate != null) {
            effectiveRate = memberRole.custom_hourly_rate
        } else {
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
        .update({
            role_id: body.roleId,
            start_time: body.startTime || null,
            end_time: body.endTime || null,
            custom_hourly_rate: body.customHourlyRate ?? null,
            hours_worked: hoursWorked,
            total_pay: totalPay,
            notes: body.notes || null,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select("*, staff_members(*), staff_roles(*)")
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    const { error } = await supabase
        .from("service_staff_assignments")
        .delete()
        .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
