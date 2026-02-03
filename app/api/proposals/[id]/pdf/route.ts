import React from "react"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { ProposalPdfDocument } from "@/components/pdf/proposal-pdf-document"
import { buildProposalPreviewData } from "@/lib/build-proposal-preview-data"
import type { CompanyForPreview } from "@/lib/build-proposal-preview-data"
import type { ProposalApiPayload } from "@/lib/build-proposal-preview-data"

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isValidId(id: unknown): id is string {
  return typeof id === "string" && id !== "" && id !== "undefined" && id !== "null" && uuidPattern.test(id)
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  if (!isValidId(params.id)) {
    return NextResponse.json({ error: "ID inválido." }, { status: 400 })
  }

  const url = new URL(request.url)
  const langParam = url.searchParams.get("lang")
  const lang = langParam === "en" ? "en" : "pt"

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
    return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 })
  }

  const { data: services, error: servicesError } = await supabase
    .from("proposal_services")
    .select(
      "id, service_id, service_name_pt, service_name_en, pricing_type, quantity, unit_price, custom_price, total_price, notes, sort_order"
    )
    .eq("proposal_id", params.id)
    .order("sort_order", { ascending: true })

  const proposalServices = servicesError ? [] : services ?? []
  const proposalServiceIds = proposalServices.map((s) => s.id).filter(Boolean) as string[]
  const serviceIds = proposalServices.map((s) => s.service_id).filter(Boolean) as string[]

  let proposalServiceOptions: unknown[] = []
  if (proposalServiceIds.length > 0) {
    const { data } = await supabase
      .from("proposal_service_options")
      .select(
        "id, proposal_service_id, service_priced_option_id, quantity, unit_price, total_price, notes, sort_order, option:service_priced_options(id, name_pt, name_en, pricing_type)"
      )
      .in("proposal_service_id", proposalServiceIds)
      .order("sort_order", { ascending: true })
    proposalServiceOptions = data ?? []
  }

  let serviceIncludedItems: unknown[] = []
  if (serviceIds.length > 0) {
    const { data } = await supabase
      .from("service_included_items")
      .select("service_id, text_pt, text_en, sort_order")
      .in("service_id", serviceIds)
      .order("sort_order", { ascending: true })
    serviceIncludedItems = data ?? []
  }

  const { data: companyRows } = await supabase
    .from("company_profile")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)

  const companyRow = companyRows?.[0] as Record<string, unknown> | undefined
  const company: CompanyForPreview = companyRow
    ? {
        name: companyRow.name as string | undefined,
        tagline_pt: companyRow.tagline_pt as string | null | undefined,
        tagline_en: companyRow.tagline_en as string | null | undefined,
        logo_url: companyRow.logo_url as string | null | undefined,
        contact_phone: companyRow.contact_phone as string | null | undefined,
        contact_email: companyRow.contact_email as string | null | undefined,
        contact_website: companyRow.contact_website as string | null | undefined,
        contact_instagram: companyRow.contact_instagram as string | null | undefined,
        contact_facebook: companyRow.contact_facebook as string | null | undefined,
        address_street: companyRow.address_street as string | null | undefined,
        address_city: companyRow.address_city as string | null | undefined,
        address_postal_code: companyRow.address_postal_code as string | null | undefined,
        address_country: companyRow.address_country as string | null | undefined,
      }
    : {}

  const payload: ProposalApiPayload = {
    ...proposal,
    proposal_services: proposalServices as ProposalApiPayload["proposal_services"],
    proposal_service_options: proposalServiceOptions as ProposalApiPayload["proposal_service_options"],
    service_included_items: serviceIncludedItems as ProposalApiPayload["service_included_items"],
  }

  const previewData = buildProposalPreviewData(payload, company, lang)
  // ProposalPdfDocument renders <Document> as root; cast satisfies renderToBuffer's DocumentProps constraint
  const pdfBuffer = await renderToBuffer(
    React.createElement(ProposalPdfDocument, { data: previewData, lang }) as Parameters<typeof renderToBuffer>[0]
  )

  const filename = `${previewData.documentTitle ?? "proposta"}.pdf`.replace(/[/\\]/g, "-")

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
    },
  })
}
