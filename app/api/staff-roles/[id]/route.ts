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
        .from("staff_roles")
        .update({
            name: body.name,
            default_hourly_rate: body.defaultHourlyRate,
            is_active: body.isActive,
            sort_order: body.sortOrder,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
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

    // Soft delete — desativar
    const { error } = await supabase
        .from("staff_roles")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("id", id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
}
