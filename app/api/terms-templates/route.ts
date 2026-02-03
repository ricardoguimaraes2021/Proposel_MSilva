import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("terms_templates")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data ?? [])
}

type TermsTemplatePayload = {
  name: string
  content_pt: string
  content_en: string
  is_default?: boolean
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = (await request.json()) as TermsTemplatePayload

  const name = body.name?.trim()
  const content_pt = body.content_pt?.trim() ?? ""
  const content_en = body.content_en?.trim() ?? ""

  if (!name) {
    return NextResponse.json({ error: "Nome do modelo é obrigatório." }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("terms_templates")
    .insert({
      name,
      content_pt: content_pt || "",
      content_en: content_en || "",
      is_default: body.is_default ?? false,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
