import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

type ProposalServicePayload = {
  service_id: string
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

type ProposalPayload = {
  reference_number?: string | null
  status?: string
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  client_company?: string | null
  client_nif?: string | null
  event_type: string
  event_type_custom_pt?: string | null
  event_type_custom_en?: string | null
  event_title?: string | null
  event_date?: string | null
  event_location?: string | null
  guest_count: number
  event_notes?: string | null
  language?: string
  show_vat?: boolean
  vat_rate?: number
  valid_until?: string | null
  custom_intro_pt?: string | null
  custom_intro_en?: string | null
  terms_pt?: string | null
  terms_en?: string | null
  subtotal?: number
  vat_amount?: number
  total?: number
  services?: ProposalServicePayload[]
  options?: ProposalServiceOptionPayload[]
}

const allowedStatuses = new Set(["draft", "sent", "accepted", "rejected"])

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = (await request.json()) as ProposalPayload

  const {
    services = [],
    options = [],
    ...proposal
  } = body

  const status = proposal.status && allowedStatuses.has(proposal.status) ? proposal.status : "draft"

  const { data: inserted, error } = await supabase
    .from("proposals")
    .insert({
      status,
      language: "pt",
      show_vat: false,
      vat_rate: 23,
      ...proposal,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (services.length) {
    const rows = services.map((service, index) => ({
      proposal_id: inserted.id,
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
      return NextResponse.json(
        { error: servicesError.message, proposal_id: inserted.id },
        { status: 500 }
      )
    }

    if (options.length) {
      const idByIndex = new Map<number, string>()
      insertedServices?.forEach((row, index) => {
        if (row?.id) idByIndex.set(index, row.id as string)
      })

      const optionRows = options
        .map((option, index) => {
          const proposalServiceId = idByIndex.get(option.service_index)
          if (!proposalServiceId) return null
          return {
            proposal_service_id: proposalServiceId,
            service_priced_option_id: option.service_priced_option_id,
            quantity: option.quantity,
            unit_price: option.unit_price,
            total_price: option.total_price,
            notes: option.notes ?? null,
            sort_order: option.sort_order ?? index + 1,
          }
        })
        .filter(Boolean)

      if (optionRows.length) {
        const { error: optionsError } = await supabase
          .from("proposal_service_options")
          .insert(optionRows)

        if (optionsError) {
          return NextResponse.json(
            { error: optionsError.message, proposal_id: inserted.id },
            { status: 500 }
          )
        }
      }
    }
  }

  return NextResponse.json(inserted)
}
