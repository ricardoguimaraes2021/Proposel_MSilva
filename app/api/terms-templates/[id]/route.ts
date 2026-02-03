import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidId(id: unknown): id is string {
  return typeof id === "string" && id !== "" && id !== "undefined" && id !== "null" && uuidPattern.test(id)
}

type TermsTemplatePayload = {
  name?: string
  content_pt?: string
  content_en?: string
  is_default?: boolean
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
    .from("terms_templates")
    .select("*")
    .eq("id", params.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Modelo não encontrado." }, { status: 404 })
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
  const body = (await request.json()) as TermsTemplatePayload

  const payload: Record<string, unknown> = {}
  if (body.name !== undefined) payload.name = body.name.trim()
  if (body.content_pt !== undefined) payload.content_pt = body.content_pt.trim()
  if (body.content_en !== undefined) payload.content_en = body.content_en.trim()
  if (body.is_default !== undefined) payload.is_default = body.is_default

  const { data, error } = await supabase
    .from("terms_templates")
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
  const { error } = await supabase.from("terms_templates").delete().eq("id", params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
