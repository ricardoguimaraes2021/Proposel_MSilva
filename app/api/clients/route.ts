import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

type ClientPayload = {
  name: string
  email?: string | null
  phone?: string | null
  company?: string | null
  nif?: string | null
  address_street?: string | null
  address_city?: string | null
  address_postal_code?: string | null
  address_country?: string | null
  notes?: string | null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = (await request.json()) as ClientPayload

  const payload: Record<string, unknown> = {
    name: body.name?.trim() ?? "",
    email: body.email?.trim() || null,
    phone: body.phone?.trim() || null,
    company: body.company?.trim() || null,
    nif: body.nif?.trim() || null,
    address_street: body.address_street?.trim() || null,
    address_city: body.address_city?.trim() || null,
    address_postal_code: body.address_postal_code?.trim() || null,
    address_country: body.address_country?.trim() || null,
    notes: body.notes?.trim() || null,
  }

  const { data, error } = await supabase
    .from("clients")
    .insert(payload)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
