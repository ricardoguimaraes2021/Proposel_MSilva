import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

const allowedStatuses = new Set(["draft", "sent", "accepted", "rejected"])
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidId(id: unknown): id is string {
  return typeof id === "string" && id !== "" && id !== "undefined" && id !== "null" && uuidPattern.test(id)
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "ID invalido." }, { status: 400 })
  }
  const supabase = await createClient()
  const { data: proposal, error: proposalError } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", params.id)
    .maybeSingle()

  if (proposalError) {
    return NextResponse.json({ error: proposalError.message }, { status: 500 })
  }

  if (!proposal) {
    return NextResponse.json({ error: "Proposta nao encontrada." }, { status: 404 })
  }

  const { data: services, error: servicesError } = await supabase
    .from("proposal_services")
    .select(
      `
      id,
      service_id,
      service_name_pt,
      service_name_en,
      pricing_type,
      quantity,
      unit_price,
      custom_price,
      total_price,
      notes,
      sort_order
    `
    )
    .eq("proposal_id", params.id)
    .order("sort_order", { ascending: true })

  const proposalServices = servicesError ? [] : services ?? []

  const proposalServiceIds = proposalServices
    .map((service) => service.id)
    .filter(Boolean) as string[]

  const serviceIds = proposalServices
    .map((service) => service.service_id)
    .filter(Boolean) as string[]

  let serviceOptions: unknown[] | null = []
  let optionsError: { message?: string } | null = null
  if (proposalServiceIds.length > 0) {
    const { data, error } = await supabase
      .from("proposal_service_options")
      .select(
        `
        id,
        proposal_service_id,
        service_priced_option_id,
        quantity,
        unit_price,
        total_price,
        notes,
        sort_order,
        option:service_priced_options(id,name_pt,name_en,pricing_type)
      `
      )
      .in("proposal_service_id", proposalServiceIds)
      .order("sort_order", { ascending: true })
    serviceOptions = data ?? []
    optionsError = error
  }

  let includedItems: unknown[] | null = []
  let includedError: { message?: string } | null = null
  if (serviceIds.length > 0) {
    const { data, error } = await supabase
      .from("service_included_items")
      .select("service_id,text_pt,sort_order")
      .in("service_id", serviceIds)
      .order("sort_order", { ascending: true })
    includedItems = data ?? []
    includedError = error
  }

  return NextResponse.json({
    ...proposal,
    proposal_services: proposalServices,
    proposal_service_options: serviceOptions ?? [],
    service_included_items: includedItems ?? [],
    services_error: servicesError?.message,
    options_error: optionsError?.message,
    included_error: includedError?.message,
  })
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "ID invalido." }, { status: 400 })
  }
  const body = (await request.json().catch(() => ({}))) as { status?: string; language?: string }
  const status = body.status
  const language = body.language === "en" ? "en" : body.language === "pt" ? "pt" : undefined

  if (!status && language === undefined) {
    return NextResponse.json({ error: "Envie status ou language." }, { status: 400 })
  }
  if (status && !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Status invalido." }, { status: 400 })
  }

  const updatePayload: { status?: string; language?: string } = {}
  if (status) updatePayload.status = status
  if (language !== undefined) updatePayload.language = language

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("proposals")
    .update(updatePayload)
    .eq("id", params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
