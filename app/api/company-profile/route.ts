import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type CompanyProfileRow = {
  id: string
  name: string
  tagline_pt: string | null
  tagline_en: string | null
  logo_url: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_website: string | null
  contact_instagram: string | null
  contact_facebook: string | null
  address_street: string | null
  address_city: string | null
  address_postal_code: string | null
  address_country: string | null
  updated_at: string
}

export async function GET() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("company_profile")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json((data?.[0] as CompanyProfileRow | undefined) ?? null)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()

  const payload = {
    ...body,
    id: body?.id || undefined,
  }

  const { data, error } = await supabase
    .from("company_profile")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
