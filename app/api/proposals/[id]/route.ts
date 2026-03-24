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

type ProposalServicePayload = {
  service_id: string | null
  service_name_pt: string
  service_name_en: string
  pricing_type: string
  quantity: number
  unit_price: number
  custom_price?: number | null
  total_price: number
  notes?: string | null
  sort_order?: number | null
}

type ProposalServiceOptionPayload = {
  service_index: number
  service_priced_option_id: string
  quantity: number
  unit_price: number
  total_price: number
  notes?: string | null
  sort_order?: number | null
}

const proposalEditableFields = [
  "client_name", "client_email", "client_phone", "client_company", "client_nif",
  "event_type", "event_type_custom_pt", "event_title", "event_date", "event_location",
  "guest_count", "custom_intro_pt", "terms_pt", "terms_en", "show_vat", "vat_rate",
  "subtotal", "vat_amount", "total", "language",
] as const

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 })
  }

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>
  const supabase = await createClient()

  const status = typeof body.status === "string" ? body.status : undefined
  if (status && !allowedStatuses.has(status)) {
    return NextResponse.json({ error: "Status inválido." }, { status: 400 })
  }

  const updatePayload: Record<string, unknown> = {}
  if (status) updatePayload.status = status
  for (const key of proposalEditableFields) {
    if (key in body) updatePayload[key] = body[key]
  }

  if (Object.keys(updatePayload).length === 0 && !body.services) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 })
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .from("proposals")
      .update(updatePayload)
      .eq("id", params.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  const services = Array.isArray(body.services) ? (body.services as ProposalServicePayload[]) : null
  const options = Array.isArray(body.options) ? (body.options as ProposalServiceOptionPayload[]) : []

  if (services) {
    const { data: existingServices } = await supabase
      .from("proposal_services")
      .select("id")
      .eq("proposal_id", params.id)

    const existingIds = (existingServices ?? []).map((s) => (s as { id: string }).id)

    if (existingIds.length > 0) {
      await supabase
        .from("proposal_service_options")
        .delete()
        .in("proposal_service_id", existingIds)

      await supabase
        .from("proposal_services")
        .delete()
        .eq("proposal_id", params.id)
    }

    if (services.length > 0) {
      const rows = services.map((service, index) => ({
        proposal_id: params.id,
        service_id: service.service_id,
        service_name_pt: service.service_name_pt,
        service_name_en: service.service_name_en,
        pricing_type: service.pricing_type,
        quantity: service.quantity,
        unit_price: service.unit_price,
        custom_price: service.custom_price ?? null,
        total_price: service.total_price,
        notes: service.notes ?? null,
        sort_order: service.sort_order ?? index + 1,
      }))

      const { data: insertedServices, error: servicesError } = await supabase
        .from("proposal_services")
        .insert(rows)
        .select("id")

      if (servicesError) {
        return NextResponse.json({ error: servicesError.message }, { status: 500 })
      }

      if (options.length && insertedServices) {
        const idByIndex = new Map<number, string>()
        insertedServices.forEach((row, index) => {
          if (row?.id) idByIndex.set(index, (row as { id: string }).id)
        })

        const optionRows = options
          .map((option) => {
            const proposalServiceId = idByIndex.get(option.service_index)
            if (!proposalServiceId) return null
            return {
              proposal_service_id: proposalServiceId,
              service_priced_option_id: option.service_priced_option_id,
              quantity: option.quantity,
              unit_price: option.unit_price,
              total_price: option.total_price,
              notes: option.notes ?? null,
              sort_order: option.sort_order ?? 1,
            }
          })
          .filter(Boolean)

        if (optionRows.length) {
          const { error: optionsError } = await supabase
            .from("proposal_service_options")
            .insert(optionRows)

          if (optionsError) {
            return NextResponse.json({ error: optionsError.message }, { status: 500 })
          }
        }
      }
    }
  }

  const { data: updated, error: fetchError } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", params.id)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }

  return NextResponse.json(updated)
}
