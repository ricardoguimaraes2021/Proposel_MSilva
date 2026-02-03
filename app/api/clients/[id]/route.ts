import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidId(id: unknown): id is string {
  return typeof id === "string" && id !== "" && id !== "undefined" && id !== "null" && uuidPattern.test(id)
}

type ClientPayload = {
  name?: string
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", params.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 })
  }

  return NextResponse.json(data)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 })
  }

  const supabase = await createClient()
  const body = (await request.json()) as ClientPayload

  const payload: Record<string, unknown> = {}
  if (body.name !== undefined) payload.name = body.name.trim()
  if (body.email !== undefined) payload.email = body.email?.trim() || null
  if (body.phone !== undefined) payload.phone = body.phone?.trim() || null
  if (body.company !== undefined) payload.company = body.company?.trim() || null
  if (body.nif !== undefined) payload.nif = body.nif?.trim() || null
  if (body.address_street !== undefined) payload.address_street = body.address_street?.trim() || null
  if (body.address_city !== undefined) payload.address_city = body.address_city?.trim() || null
  if (body.address_postal_code !== undefined) payload.address_postal_code = body.address_postal_code?.trim() || null
  if (body.address_country !== undefined) payload.address_country = body.address_country?.trim() || null
  if (body.notes !== undefined) payload.notes = body.notes?.trim() || null
  payload.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from("clients")
    .update(payload)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 })
  }

  const supabase = await createClient()
  const { error } = await supabase.from("clients").delete().eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
