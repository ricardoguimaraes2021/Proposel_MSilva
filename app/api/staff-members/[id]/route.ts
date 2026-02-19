import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params
    const body = await request.json()

    // Atualizar dados do funcionário
    const { data, error } = await supabase
        .from("staff_members")
        .update({
            first_name: body.firstName,
            last_name: body.lastName,
            phone: body.phone || null,
            nif: body.nif || null,
            notes: body.notes || null,
            is_active: body.isActive ?? true,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Atualizar funções — apagar existentes e reinserir
    if (body.roles !== undefined) {
        const { error: deleteError } = await supabase
            .from("staff_member_roles")
            .delete()
            .eq("staff_member_id", id)

        if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

        if (body.roles.length > 0) {
            const roleRows = body.roles.map((r: { roleId: string; customHourlyRate?: number | null }) => ({
                staff_member_id: id,
                role_id: r.roleId,
                custom_hourly_rate: r.customHourlyRate ?? null,
            }))

            const { error: rolesError } = await supabase
                .from("staff_member_roles")
                .insert(roleRows)

            if (rolesError) return NextResponse.json({ error: rolesError.message }, { status: 500 })
        }
    }

    return NextResponse.json(data)
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const supabase = await createClient()
    const { id } = await params

    // Soft delete
    const { error } = await supabase
        .from("staff_members")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
