import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from("staff_roles")
        .select("*")
        .order("sort_order", { ascending: true })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}

export async function POST(request: Request) {
    const supabase = await createClient()
    const body = await request.json()

    const { data, error } = await supabase
        .from("staff_roles")
        .insert({
            name: body.name,
            default_hourly_rate: body.defaultHourlyRate ?? 0,
            sort_order: body.sortOrder ?? 0,
        })
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
}
