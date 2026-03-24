"use client"

import { useMemo } from "react"
import { ProposalWizard, type ProposalInitialData } from "@/components/dashboard/proposal-wizard"
import type { PricingType, Service } from "@/types"

type CategoryRow = {
  id: string
  name_pt: string
  name_en: string
  sort_order?: number | null
}

type ClientOption = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  nif: string | null
  address_street?: string | null
  address_city?: string | null
  address_postal_code?: string | null
  address_country?: string | null
}

type TermsTemplateOption = {
  id: string
  name: string
  content_pt: string
  content_en: string
}

type ProposalEditFormProps = {
  proposalId: string
  proposal: Record<string, unknown>
  proposalServices: Record<string, unknown>[]
  proposalServiceOptions: Record<string, unknown>[]
  services: Service[]
  categories: CategoryRow[]
  clients?: ClientOption[]
  termsTemplates?: TermsTemplateOption[]
  companyName?: string
  companyTagline?: string
  companyLogoUrl?: string
  companyContact?: {
    phone?: string
    email?: string
    website?: string
    instagram?: string
    facebook?: string
    address?: string
  }
  eventTypeMap: Record<string, string>
}

function extractNotesWithoutOptionalMarker(notes: string | null | undefined): string {
  if (!notes) return ""
  return notes
    .replace(/\s*\|\s*Op[cç][ãa]o apresentada\s*$/i, "")
    .trim()
}

function isOptionalService(notes: string | null | undefined): boolean {
  if (!notes) return false
  return /Op[cç][ãa]o apresentada/i.test(notes)
}

export function ProposalEditForm({
  proposalId,
  proposal,
  proposalServices,
  proposalServiceOptions,
  services,
  categories,
  clients,
  termsTemplates,
  companyName,
  companyTagline,
  companyLogoUrl,
  companyContact,
  eventTypeMap,
}: ProposalEditFormProps) {
  const initialData = useMemo<ProposalInitialData>(() => {
    const p = proposal

    const eventTypeRaw = (p.event_type as string) ?? "other"
    const eventTypeDisplay = (p.event_type_custom_pt as string) || eventTypeMap[eventTypeRaw] || eventTypeRaw

    const catalogServiceIds = new Set(services.map((s) => s.id))

    const customServicesList: Service[] = []
    const selectedServicesMap: Record<string, {
      serviceId: string
      quantity: number
      includeInTotal: boolean
      overridePrice?: number
      notes?: string
      options: Record<string, { optionId: string; quantity: number; overridePrice?: number; notes?: string }>
    }> = {}
    const orderList: string[] = []

    const optionsByPsId = new Map<string, Record<string, unknown>[]>()
    proposalServiceOptions.forEach((opt) => {
      const psId = opt.proposal_service_id as string
      const list = optionsByPsId.get(psId) ?? []
      list.push(opt)
      optionsByPsId.set(psId, list)
    })

    proposalServices.forEach((ps) => {
      const serviceId = ps.service_id as string | null
      const psId = ps.id as string
      const isCustom = !serviceId || !catalogServiceIds.has(serviceId)

      let resolvedId: string

      if (isCustom) {
        resolvedId = `custom-${psId}`
        const notesRaw = (ps.notes as string) ?? ""
        const cleanNotes = extractNotesWithoutOptionalMarker(notesRaw)

        const newService: Service = {
          id: resolvedId,
          categoryId: "custom",
          name: {
            pt: (ps.service_name_pt as string) ?? "",
            en: (ps.service_name_en as string) ?? (ps.service_name_pt as string) ?? "",
          },
          pricingType: (ps.pricing_type as PricingType) ?? "per_person",
          basePrice: ps.unit_price != null ? Number(ps.unit_price) : 0,
          sortOrder: customServicesList.length + 1,
          minQuantity: 1,
          unit: { pt: "pessoa", en: "person" },
          description: { pt: "", en: "" },
          isActive: true,
          includedItems: cleanNotes
            ? cleanNotes.split("\n").filter(Boolean).map((text, i) => ({
                id: `cs-item-${psId}-${i}`,
                serviceId: resolvedId,
                sectionKey: "main",
                text: { pt: text, en: text },
                sortOrder: i,
              }))
            : [],
          pricedOptions: [],
        }
        customServicesList.push(newService)
      } else {
        resolvedId = serviceId!
      }

      const includeInTotal = !isOptionalService(ps.notes as string | null)

      const psOptions = optionsByPsId.get(psId) ?? []
      const optionsMap: Record<string, { optionId: string; quantity: number; overridePrice?: number; notes?: string }> = {}
      psOptions.forEach((opt) => {
        const optId = opt.service_priced_option_id as string
        if (!optId) return
        optionsMap[optId] = {
          optionId: optId,
          quantity: Number(opt.quantity) || 1,
          overridePrice: opt.unit_price != null ? Number(opt.unit_price) : undefined,
          notes: extractNotesWithoutOptionalMarker(opt.notes as string | null) || undefined,
        }
      })

      const notesText = extractNotesWithoutOptionalMarker(ps.notes as string | null)
      const catalogService = services.find((s) => s.id === resolvedId)
      const defaultIncluded = catalogService?.includedItems
        ?.slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((item) => item.text.pt)
        .join("\n")
        .trim()

      selectedServicesMap[resolvedId] = {
        serviceId: resolvedId,
        quantity: Number(ps.quantity) || 1,
        includeInTotal,
        overridePrice: ps.custom_price != null ? Number(ps.custom_price) : undefined,
        notes: notesText && notesText !== defaultIncluded ? notesText : undefined,
        options: optionsMap,
      }
      orderList.push(resolvedId)
    })

    return {
      clientName: (p.client_name as string) ?? "",
      clientEmail: (p.client_email as string) ?? "",
      clientPhone: (p.client_phone as string) ?? "",
      clientCompany: (p.client_company as string) ?? "",
      clientNif: (p.client_nif as string) ?? "",
      eventTitle: (p.event_title as string) ?? "",
      eventType: eventTypeDisplay,
      eventDate: (p.event_date as string) ?? "",
      eventLocation: (p.event_location as string) ?? "",
      guestCount: p.guest_count != null ? String(p.guest_count) : "",
      valuesIncludeVat: Boolean(p.show_vat),
      pdfLanguage: (p.language as "pt" | "en") ?? "pt",
      contextText: (p.custom_intro_pt as string) ?? "",
      termsPt: (p.terms_pt as string) ?? "",
      termsEn: (p.terms_en as string) ?? "",
      selectedServices: selectedServicesMap,
      serviceOrder: orderList,
      customServices: customServicesList,
    }
  }, [proposal, proposalServices, proposalServiceOptions, services, eventTypeMap])

  return (
    <ProposalWizard
      proposalId={proposalId}
      initialData={initialData}
      services={services}
      categories={categories}
      clients={clients}
      termsTemplates={termsTemplates}
      companyName={companyName}
      companyTagline={companyTagline}
      companyLogoUrl={companyLogoUrl}
      companyContact={companyContact}
    />
  )
}
