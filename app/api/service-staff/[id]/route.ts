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
        .from("service_staff_assignments")
        .update({
            role_id: body.roleId,
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
