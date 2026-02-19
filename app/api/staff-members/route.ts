import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    const supabase = await createClient()

    // Buscar funcionários com as suas funções
    const { data: members, error: membersError } = await supabase
        .from("staff_members")
        .select("*")
        .order("first_name", { ascending: true })

    if (membersError) return NextResponse.json({ error: membersError.message }, { status: 500 })

    // Buscar as relações staff ↔ roles
    const { data: memberRoles, error: rolesError } = await supabase
        .from("staff_member_roles")
        .select("*, staff_roles(*)")

    if (rolesError) return NextResponse.json({ error: rolesError.message }, { status: 500 })

    // Agrupar roles por staff_member_id
    const rolesByMember = (memberRoles ?? []).reduce<Record<string, typeof memberRoles>>((acc, mr) => {
        if (!acc[mr.staff_member_id]) acc[mr.staff_member_id] = []
        acc[mr.staff_member_id].push(mr)
        return acc
    }, {})

    const result = (members ?? []).map((m) => ({
        ...m,
        roles: rolesByMember[m.id] ?? [],
    }))

    return NextResponse.json(result)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const body = await request.json()

    // Criar funcionário
    const { data: member, error: memberError } = await supabase
        .from("staff_members")
        .insert({
            first_name: body.firstName,
            last_name: body.lastName,
            phone: body.phone || null,
            nif: body.nif || null,
            notes: body.notes || null,
        })
        .select()
        .single()

    if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 })

    // Atribuir funções
    if (body.roles && body.roles.length > 0) {
        const roleRows = body.roles.map((r: { roleId: string; customHourlyRate?: number | null }) => ({
            staff_member_id: member.id,
            role_id: r.roleId,
            custom_hourly_rate: r.customHourlyRate ?? null,
        }))

        const { error: rolesError } = await supabase
            .from("staff_member_roles")
            .insert(roleRows)

        if (rolesError) {
            return NextResponse.json({ error: rolesError.message, staff_member_id: member.id }, { status: 500 })
        }
    }

    return NextResponse.json(member)
}
