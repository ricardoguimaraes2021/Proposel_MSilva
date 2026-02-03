import type { ProposalPreviewData, ProposalPreviewService, ProposalPreviewOption } from "@/components/pdf/proposal-preview"
import type { PricingType } from "@/types"

type ProposalServiceRow = {
  id: string
  service_id: string | null
  service_name_pt: string
  service_name_en: string
  pricing_type: PricingType
  quantity: number
  unit_price: number
  custom_price: number | null
  total_price: number
  notes: string | null
  sort_order: number | null
}

type ProposalServiceOptionRow = {
  id: string
  proposal_service_id: string
  service_priced_option_id: string
  quantity: number
  unit_price: number
  total_price: number
  notes: string | null
  sort_order: number | null
  option?: {
    id: string
    name_pt: string
    name_en: string
    pricing_type: PricingType
  } | null
}

type IncludedItemRow = {
  service_id: string
  text_pt: string
  text_en?: string
  sort_order: number | null
}

type ProposalRow = {
  id: string
  reference_number: string | null
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  client_company?: string | null
  client_nif?: string | null
  event_title: string | null
  event_type: string
  event_type_custom_pt: string | null
  event_type_custom_en?: string | null
  event_date: string | null
  event_location: string | null
  guest_count: number | null
  show_vat: boolean | null
  subtotal: number | null
  total: number | null
  custom_intro_pt?: string | null
  custom_intro_en?: string | null
  terms_pt?: string | null
  terms_en?: string | null
}

export type CompanyForPreview = {
  name?: string
  tagline_pt?: string | null
  tagline_en?: string | null
  logo_url?: string | null
  contact_phone?: string | null
  contact_email?: string | null
  contact_website?: string | null
  contact_instagram?: string | null
  contact_facebook?: string | null
  address_street?: string | null
  address_city?: string | null
  address_postal_code?: string | null
  address_country?: string | null
}

const eventTypeLabelsPt: Record<string, string> = {
  wedding: "Casamento",
  corporate: "Empresa",
  private: "Privado",
  other: "Evento",
}

const eventTypeLabelsEn: Record<string, string> = {
  wedding: "Wedding",
  corporate: "Corporate",
  private: "Private",
  other: "Event",
}

function formatDate(value: string | null, locale: "pt-PT" | "en-GB"): string {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale)
}

function parseOptionalNotes(notes: string | null): { isOptional: boolean; detailsText: string } {
  if (!notes) return { isOptional: false, detailsText: "" }
  let cleaned = notes
  const optionalRegex = /(\s*\|\s*)?Opcao apresentada\s*$/i
  if (optionalRegex.test(cleaned)) {
    cleaned = cleaned.replace(optionalRegex, "").trim()
    return { isOptional: true, detailsText: cleaned }
  }
  if (/Opcao apresentada/i.test(cleaned)) {
    cleaned = cleaned.replace(/Opcao apresentada/gi, "").trim()
    return { isOptional: true, detailsText: cleaned }
  }
  return { isOptional: false, detailsText: cleaned.trim() }
}

function buildPriceNote(
  pricingType: PricingType,
  unitPrice: number,
  override: number | null | undefined,
  lang: "pt" | "en"
): string | undefined {
  if (pricingType !== "on_request") return undefined
  if (override === null && unitPrice === 0) return lang === "en" ? "On request" : "Sob consulta"
  if (override === undefined && unitPrice === 0) return lang === "en" ? "On request" : "Sob consulta"
  return undefined
}

export type ProposalApiPayload = {
  id: string
  reference_number?: string | null
  client_name: string
  client_email?: string | null
  client_phone?: string | null
  client_company?: string | null
  client_nif?: string | null
  event_title?: string | null
  event_type: string
  event_type_custom_pt?: string | null
  event_type_custom_en?: string | null
  event_date?: string | null
  event_location?: string | null
  guest_count?: number | null
  show_vat?: boolean | null
  subtotal?: number | null
  total?: number | null
  custom_intro_pt?: string | null
  custom_intro_en?: string | null
  terms_pt?: string | null
  terms_en?: string | null
  proposal_services?: ProposalServiceRow[]
  proposal_service_options?: ProposalServiceOptionRow[]
  service_included_items?: IncludedItemRow[]
}

/**
 * Constrói ProposalPreviewData a partir da resposta da API da proposta e do perfil da empresa.
 * Usado pela tabela de propostas (no cliente) e pela rota de PDF (no servidor).
 * @param lang - Idioma do conteúdo (pt ou en) para nomes, itens incluídos, labels e secções.
 */
export function buildProposalPreviewData(
  proposal: ProposalApiPayload,
  company: CompanyForPreview,
  lang: "pt" | "en" = "pt"
): ProposalPreviewData {
  const services = (proposal.proposal_services ?? []) as ProposalServiceRow[]
  const options = (proposal.proposal_service_options ?? []) as ProposalServiceOptionRow[]
  const includedItems = (proposal.service_included_items ?? []) as IncludedItemRow[]

  const sortedServices = services.slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  const includedMap = new Map<string, string[]>()
  includedItems.forEach((item) => {
    const list = includedMap.get(item.service_id) ?? []
    const text = lang === "en" ? (item.text_en ?? item.text_pt) : item.text_pt
    list.push(text)
    includedMap.set(item.service_id, list)
  })

  const optionMap = new Map<string, ProposalServiceOptionRow[]>()
  options.forEach((opt) => {
    const list = optionMap.get(opt.proposal_service_id) ?? []
    list.push(opt)
    optionMap.set(opt.proposal_service_id, list)
  })

  const buildOptions = (optionRows: ProposalServiceOptionRow[]): ProposalPreviewOption[] => {
    return optionRows
      .slice()
      .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
      .map((row) => {
        const option = row.option
        const pricingType = (option?.pricing_type ?? "fixed") as PricingType
        const priceNote = buildPriceNote(pricingType, row.unit_price, undefined, lang)
        const optionName = lang === "en" ? (option?.name_en ?? option?.name_pt) : (option?.name_pt ?? option?.name_en)
        return {
          name: optionName || (lang === "en" ? "Option" : "Opção"),
          pricingType,
          quantity: row.quantity,
          unitPrice: row.unit_price,
          totalPrice: row.total_price,
          priceNote,
        }
      })
  }

  const includedPreview: ProposalPreviewService[] = []
  const optionalPreview: ProposalPreviewService[] = []

  sortedServices.forEach((service) => {
    const parsed = parseOptionalNotes(service.notes)
    const includedText = parsed.detailsText
      ? parsed.detailsText
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
      : includedMap.get(service.service_id ?? "") ?? []

    const priceNote = buildPriceNote(
      service.pricing_type,
      service.unit_price,
      service.custom_price,
      lang
    )

    const serviceName = lang === "en" ? (service.service_name_en || service.service_name_pt) : (service.service_name_pt || service.service_name_en)
    const entry: ProposalPreviewService = {
      name: serviceName,
      pricingType: service.pricing_type,
      quantity: service.quantity,
      unitPrice: service.unit_price,
      totalPrice: service.total_price,
      includedItems: includedText,
      options: buildOptions(optionMap.get(service.id) ?? []),
      priceNote,
    }

    if (parsed.isOptional) {
      optionalPreview.push(entry)
    } else {
      includedPreview.push(entry)
    }
  })

  const eventTypeLabels = lang === "en" ? eventTypeLabelsEn : eventTypeLabelsPt
  const eventTypeLabel =
    (lang === "en" ? proposal.event_type_custom_en : proposal.event_type_custom_pt) ||
    proposal.event_type_custom_pt ||
    proposal.event_type_custom_en ||
    eventTypeLabels[String(proposal.event_type)] ||
    String(proposal.event_type || (lang === "en" ? "Event" : "Evento"))
  const titleBase = proposal.event_title?.trim()
    ? proposal.event_title.trim()
    : eventTypeLabel
  const eventDate = formatDate(proposal.event_date ?? null, lang === "en" ? "en-GB" : "pt-PT")
  const guestBasis = proposal.guest_count
    ? lang === "en"
      ? `Quote based on ${proposal.guest_count} guests`
      : `Orçamento baseado em ${proposal.guest_count} pessoas`
    : undefined
  const vatNote =
    proposal.show_vat === false
      ? (lang === "en" ? "Values shown: excluding VAT" : "Valores apresentados: sem IVA")
      : (lang === "en" ? "Values shown: including VAT" : "Valores apresentados: com IVA")
  const documentTitle = [
    lang === "en" ? "Proposal" : "Proposta",
    proposal.reference_number || proposal.id,
    proposal.event_date
      ? String(proposal.event_date).replace(/[/\\]/g, "-")
      : "",
  ]
    .filter(Boolean)
    .join("_")

  const addressParts = [
    company.address_street,
    [company.address_postal_code, company.address_city].filter(Boolean).join(" "),
    company.address_country,
  ].filter(Boolean)
  const address = addressParts.length ? addressParts.join(", ") : undefined

  return {
    companyName: company.name || "MSilva",
    companyTagline: (lang === "en" ? company.tagline_en : company.tagline_pt) ?? (company.tagline_pt ?? company.tagline_en) ?? undefined,
    companyLogoUrl: company.logo_url ?? undefined,
    companyContact: {
      phone: company.contact_phone ?? undefined,
      email: company.contact_email ?? undefined,
      website: company.contact_website ?? undefined,
      instagram: company.contact_instagram ?? undefined,
      facebook: company.contact_facebook ?? undefined,
      address,
    },
    documentTitle,
    title: lang === "en"
      ? `QUOTE PROPOSAL - ${String(titleBase).toUpperCase()}`
      : `PROPOSTA DE ORÇAMENTO - ${String(titleBase).toUpperCase()}`,
    vatNote,
    clientName: proposal.client_name,
    clientEmail: proposal.client_email ?? undefined,
    clientPhone: proposal.client_phone ?? undefined,
    clientCompany: proposal.client_company ?? undefined,
    clientNif: proposal.client_nif ?? undefined,
    eventTitle: proposal.event_title ?? undefined,
    eventType: eventTypeLabel,
    eventDate,
    eventLocation: proposal.event_location ?? undefined,
    guestCount: proposal.guest_count ? String(proposal.guest_count) : undefined,
    guestBasis,
    services: includedPreview,
    optionalServices: optionalPreview,
    subtotal: Number(proposal.subtotal ?? proposal.total ?? 0),
    sections:
      (lang === "en" ? proposal.custom_intro_en : proposal.custom_intro_pt) ||
      proposal.custom_intro_pt ||
      proposal.custom_intro_en
        ? [{
            title: lang === "en" ? "Service Context" : "Enquadramento do Serviço",
            body: (lang === "en" ? proposal.custom_intro_en : proposal.custom_intro_pt) ?? proposal.custom_intro_pt ?? proposal.custom_intro_en ?? "",
          }]
        : [],
    footerNotes: (lang === "en" ? proposal.terms_en : proposal.terms_pt) ?? proposal.terms_pt ?? proposal.terms_en ?? undefined,
  }
}
