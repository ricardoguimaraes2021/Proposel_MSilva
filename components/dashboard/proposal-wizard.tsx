"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { ChevronUp, ChevronDown } from "lucide-react"
import type { PricingType, Service, ServiceIncludedItem, ServicePricedOption } from "@/types"
import { ProposalPreview, type ProposalPreviewData, type ProposalPreviewService, type ProposalPreviewOption } from "@/components/pdf/proposal-preview"
import { sanitizePhoneInput, validatePortugueseNif } from "@/lib/utils"

const pricingTypeLabels: Record<PricingType, string> = {
  per_person: "Por pessoa",
  fixed: "Fixo",
  on_request: "Sob consulta",
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-PT", { style: "currency", currency: "EUR" }).format(value)

type CategoryRow = {
  id: string
  name_pt: string
  name_en: string
  sort_order?: number | null
}

type ServiceSelection = {
  serviceId: string
  quantity: number
  includeInTotal: boolean
  overridePrice?: number
  notes?: string
  options: Record<string, OptionSelection>
}

type OptionSelection = {
  optionId: string
  quantity: number
  overridePrice?: number
  notes?: string
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

function formatClientAddress(c: ClientOption): string {
  const parts = [
    c.address_street?.trim(),
    [c.address_postal_code?.trim(), c.address_city?.trim()].filter(Boolean).join(" "),
    c.address_country?.trim(),
  ].filter(Boolean)
  return parts.length ? parts.join(", ") : ""
}

type TermsTemplateOption = {
  id: string
  name: string
  content_pt: string
  content_en: string
}

type ProposalWizardProps = {
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
}

const defaultContext = ""

const getEffectiveUnitPrice = (pricingType: PricingType, basePrice: number | null | undefined, overridePrice?: number) => {
  if (overridePrice !== undefined) return overridePrice
  if (pricingType === "on_request") return null
  return basePrice ?? 0
}

const getQuantityLabel = (pricingType: PricingType, unit?: { pt: string; en: string }) => {
  if (pricingType !== "per_person") return null
  return unit?.pt || "pessoa"
}

const buildIncludedItems = (items?: ServiceIncludedItem[]) =>
  (items ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((item) => item.text.pt)

const buildOptions = (options?: ServicePricedOption[]) =>
  (options ?? [])
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)

export function ProposalWizard({
  services,
  categories,
  clients = [],
  termsTemplates = [],
  companyName = "MSilva",
  companyTagline,
  companyLogoUrl,
  companyContact,
}: ProposalWizardProps) {
  const router = useRouter()
  const firstTemplate = termsTemplates[0]
  const [step, setStep] = useState(0)
  const [selectedClientId, setSelectedClientId] = useState<string>("")
  const [clientName, setClientName] = useState("")
  const [clientEmail, setClientEmail] = useState("")
  const [clientPhone, setClientPhone] = useState("")
  const [clientCompany, setClientCompany] = useState("")
  const [clientNif, setClientNif] = useState("")
  const [eventTitle, setEventTitle] = useState("")
  const [eventType, setEventType] = useState("Casamento")
  const [eventDate, setEventDate] = useState("")
  const [eventLocation, setEventLocation] = useState("")
  const [guestCount, setGuestCount] = useState("")
  /** true = valores com IVA (PT) / including VAT (EN); false = valores sem IVA / excluding VAT */
  const [valuesIncludeVat, setValuesIncludeVat] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [nifError, setNifError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [contextText, setContextText] = useState(defaultContext)
  const [termsTemplateId, setTermsTemplateId] = useState(firstTemplate?.id ?? "")
  const [termsPt, setTermsPt] = useState(firstTemplate?.content_pt ?? "")
  const [termsEn, setTermsEn] = useState(firstTemplate?.content_en ?? "")
  const [pdfLanguage, setPdfLanguage] = useState<"pt" | "en">("pt")

  const [selectedServices, setSelectedServices] = useState<Record<string, ServiceSelection>>({})
  const [serviceOrder, setServiceOrder] = useState<string[]>([])

  const steps = ["Cliente", "Evento", "Servicos", "Conteudo", "Resumo"]

  const serviceById = useMemo(() => new Map(services.map((service) => [service.id, service])), [services])

  const sortedCategories = useMemo(() => {
    const safe = categories.map((category) => ({
      ...category,
      sort_order: category.sort_order ?? 0,
    }))
    safe.sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    return safe
  }, [categories])

  const servicesByCategory = useMemo(() => {
    const map = new Map<string, Service[]>()
    services.forEach((service) => {
      const categoryId = service.categoryId || "uncategorized"
      const list = map.get(categoryId) ?? []
      list.push(service)
      map.set(categoryId, list)
    })

    map.forEach((list) => list.sort((a, b) => a.sortOrder - b.sortOrder))
    return map
  }, [services])

  const guestCountNumber = Number(guestCount)
  const lastGuestCountRef = useRef(guestCountNumber)

  useEffect(() => {
    const current = Number.isFinite(guestCountNumber) ? guestCountNumber : 0
    const previous = lastGuestCountRef.current
    if (current === previous) return

    setSelectedServices((prev) => {
      const next: Record<string, ServiceSelection> = { ...prev }
      Object.keys(next).forEach((serviceId) => {
        const service = serviceById.get(serviceId)
        if (!service) return
        if (service.pricingType === "per_person" && next[serviceId].quantity === previous) {
          next[serviceId] = { ...next[serviceId], quantity: current || 1 }
        }

        const updatedOptions: Record<string, OptionSelection> = { ...next[serviceId].options }
        Object.values(updatedOptions).forEach((option) => {
          const optionData = service.pricedOptions?.find((opt) => opt.id === option.optionId)
          if (optionData?.pricingType === "per_person" && option.quantity === previous) {
            updatedOptions[option.optionId] = { ...option, quantity: current || 1 }
          }
        })
        next[serviceId] = { ...next[serviceId], options: updatedOptions }
      })
      return next
    })

    lastGuestCountRef.current = current
  }, [guestCountNumber, serviceById])

  const handleTemplateChange = (value: string) => {
    setTermsTemplateId(value)
    const template = termsTemplates.find((item) => item.id === value)
    if (template) {
      setTermsPt(template.content_pt)
      setTermsEn(template.content_en)
    } else {
      setTermsPt("")
      setTermsEn("")
    }
  }

  const toggleService = (serviceId: string, checked: boolean) => {
    if (!checked) {
      setSelectedServices((prev) => {
        const next = { ...prev }
        delete next[serviceId]
        return next
      })
      setServiceOrder((prev) => prev.filter((id) => id !== serviceId))
      return
    }

    const service = serviceById.get(serviceId)
    if (!service) return

    const baseQuantity = service.pricingType === "per_person"
      ? (Number.isFinite(guestCountNumber) && guestCountNumber > 0 ? guestCountNumber : 1)
      : 1

    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: {
        serviceId,
        quantity: baseQuantity,
        includeInTotal: true,
        options: {},
      },
    }))
    setServiceOrder((prev) => (prev.includes(serviceId) ? prev : [...prev, serviceId]))
  }

  const updateServiceField = (serviceId: string, patch: Partial<ServiceSelection>) => {
    setSelectedServices((prev) => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        ...patch,
      },
    }))
  }

  const updateServiceOption = (
    serviceId: string,
    optionId: string,
    patch?: Partial<OptionSelection>,
    remove?: boolean,
    defaultQuantity?: number
  ) => {
    setSelectedServices((prev) => {
      const service = prev[serviceId]
      if (!service) return prev
      const options = { ...service.options }
      if (remove) {
        delete options[optionId]
      } else {
        const current = options[optionId] ?? {
          optionId,
          quantity: defaultQuantity ?? 1,
        }
        options[optionId] = { ...current, ...patch }
      }
      return {
        ...prev,
        [serviceId]: { ...service, options },
      }
    })
  }

  const selectedList = useMemo(() => Object.values(selectedServices), [selectedServices])

  const sortedSelectedList = useMemo(() => {
    const order = serviceOrder.slice()
    const byId = new Map(selectedList.map((e) => [e.serviceId, e]))
    const ordered: ServiceSelection[] = []
    order.forEach((id) => {
      const entry = byId.get(id)
      if (entry) ordered.push(entry)
    })
    selectedList.forEach((entry) => {
      if (!order.includes(entry.serviceId)) ordered.push(entry)
    })
    return ordered
  }, [selectedList, serviceOrder])

  const includedServices = useMemo(() => sortedSelectedList.filter((entry) => entry.includeInTotal), [sortedSelectedList])
  const optionalServices = useMemo(() => sortedSelectedList.filter((entry) => !entry.includeInTotal), [sortedSelectedList])

  const moveServiceInOrder = (index: number, direction: 1 | -1) => {
    const newOrder = serviceOrder.slice()
    const target = index + direction
    if (target < 0 || target >= newOrder.length) return
    ;[newOrder[index], newOrder[target]] = [newOrder[target], newOrder[index]]
    setServiceOrder(newOrder)
  }

  const computeServiceTotals = (entry: ServiceSelection) => {
    const service = serviceById.get(entry.serviceId)
    if (!service) return { unitPrice: 0, total: 0, priceNote: undefined as string | undefined }

    const unitPrice = getEffectiveUnitPrice(service.pricingType, service.basePrice, entry.overridePrice)
    const priceNote = service.pricingType === "on_request" && entry.overridePrice === undefined
      ? "Sob consulta"
      : undefined

    if (unitPrice === null) {
      return { unitPrice: 0, total: 0, priceNote }
    }

    const total = unitPrice * (entry.quantity || 1)
    return { unitPrice, total, priceNote }
  }

  const computeOptionTotals = (service: Service, option: ServicePricedOption, selection: OptionSelection) => {
    const unitPrice = getEffectiveUnitPrice(option.pricingType, option.price ?? null, selection.overridePrice)
    const priceNote = option.pricingType === "on_request" && selection.overridePrice === undefined
      ? "Sob consulta"
      : undefined

    if (unitPrice === null) {
      return { unitPrice: 0, total: 0, priceNote }
    }

    const total = unitPrice * (selection.quantity || 1)
    return { unitPrice, total, priceNote }
  }

  const subtotal = useMemo(() => {
    return includedServices.reduce((sum, entry) => {
      const service = serviceById.get(entry.serviceId)
      if (!service) return sum
      const { total } = computeServiceTotals(entry)

      const optionsTotal = Object.values(entry.options).reduce((optionSum, optionEntry) => {
        const option = service.pricedOptions?.find((opt) => opt.id === optionEntry.optionId)
        if (!option) return optionSum
        const { total: optionTotal } = computeOptionTotals(service, option, optionEntry)
        return optionSum + optionTotal
      }, 0)

      return sum + total + optionsTotal
    }, 0)
  }, [includedServices, serviceById])

  const contentSections = useMemo(() => {
    const sections: { title: string; body: string }[] = []
    if (contextText.trim().length > 0) {
      sections.push({ title: "Enquadramento do Servico", body: contextText })
    }
    return sections
  }, [contextText])

  const buildPreviewService = (entry: ServiceSelection): ProposalPreviewService | null => {
    const service = serviceById.get(entry.serviceId)
    if (!service) return null

    const unitPrice = getEffectiveUnitPrice(service.pricingType, service.basePrice, entry.overridePrice)
    const priceNote = service.pricingType === "on_request" && entry.overridePrice === undefined
      ? "Sob consulta"
      : undefined

    const detailsText = entry.notes && entry.notes.trim().length
      ? entry.notes.trim()
      : null

    const includedItems = detailsText
      ? detailsText
          .split(/\n+/)
          .map((line) => line.trim())
          .filter(Boolean)
      : buildIncludedItems(service.includedItems)

    const options: ProposalPreviewOption[] = Object.values(entry.options)
      .map((optionEntry) => {
        const option = service.pricedOptions?.find((opt) => opt.id === optionEntry.optionId)
        if (!option) return null
        const { unitPrice: optionUnit, total: optionTotal, priceNote: optionNote } = computeOptionTotals(service, option, optionEntry)

        return {
          name: option.name.pt,
          pricingType: option.pricingType,
          quantity: optionEntry.quantity,
          unitPrice: optionUnit,
          totalPrice: optionTotal,
          priceNote: optionNote,
        }
      })
      .filter(Boolean) as ProposalPreviewOption[]

    return {
      name: service.name.pt,
      pricingType: service.pricingType,
      quantity: entry.quantity,
      unitPrice: unitPrice ?? 0,
      totalPrice: unitPrice === null ? 0 : (unitPrice ?? 0) * (entry.quantity || 1),
      priceNote,
      includedItems,
      options,
    }
  }

  const previewData = useMemo<ProposalPreviewData>(() => {
    const titleBase = eventTitle?.trim() ? eventTitle.trim() : eventType

    const includedPreview = includedServices
      .map(buildPreviewService)
      .filter(Boolean) as ProposalPreviewService[]

    const optionalPreview = optionalServices
      .map(buildPreviewService)
      .filter(Boolean) as ProposalPreviewService[]

    const isEn = pdfLanguage === "en"
    const eventTypeLabelEn: Record<string, string> = {
      wedding: "Wedding",
      corporate: "Corporate",
      private: "Private",
      other: "Event",
    }
    const eventTypeNorm = eventType.trim().toLowerCase()
    const eventKey =
      eventTypeNorm.includes("casamento") ? "wedding"
      : eventTypeNorm.includes("empresa") || eventTypeNorm.includes("corporate") || eventTypeNorm.includes("empresarial") ? "corporate"
      : eventTypeNorm.includes("privad") ? "private"
      : "other"
    const eventTypeDisplay = isEn ? (eventTypeLabelEn[eventKey] ?? eventType) : eventType
    const title = isEn
      ? (titleBase ? `QUOTE PROPOSAL - ${titleBase.toUpperCase()}` : "QUOTE PROPOSAL")
      : (titleBase ? `PROPOSTA DE ORÇAMENTO - ${titleBase.toUpperCase()}` : "PROPOSTA DE ORÇAMENTO")
    const guestBasisDisplay = guestCount
      ? (isEn ? `Quote based on ${guestCount} guests` : `Orçamento baseado em ${guestCount} pessoas`)
      : undefined
    const vatNoteDisplay = isEn
      ? (valuesIncludeVat ? "Values shown: including VAT" : "Values shown: excluding VAT")
      : (valuesIncludeVat ? "Valores apresentados: com IVA" : "Valores apresentados: sem IVA")

    return {
      companyName,
      companyTagline,
      companyLogoUrl,
      companyContact,
      title,
      vatNote: vatNoteDisplay,
      clientName,
      clientEmail,
      clientPhone,
      eventTitle,
      eventType: eventTypeDisplay,
      eventDate,
      eventLocation,
      guestCount,
      guestBasis: guestBasisDisplay,
      subtotal,
      sections: contentSections,
      footerNotes: isEn ? termsEn : termsPt,
      services: includedPreview,
      optionalServices: optionalPreview,
    }
  }, [
    includedServices,
    optionalServices,
    companyName,
    companyTagline,
    companyLogoUrl,
    companyContact,
    clientName,
    clientEmail,
    clientPhone,
    eventTitle,
    eventType,
    eventDate,
    eventLocation,
    guestCount,
    valuesIncludeVat,
    pdfLanguage,
    subtotal,
    contentSections,
    termsPt,
    termsEn,
  ])

  const handleDownloadPdf = async () => {
    setIsGenerating(true)
    setDownloadError(null)
    setNifError(null)
    try {
      setSaveError(null)
      if (clientNif.trim() && !validatePortugueseNif(clientNif)) {
        setDownloadError("NIF inválido.")
        setNifError("NIF inválido.")
        setIsGenerating(false)
        return
      }
      setIsSaving(true)
      const showVat = valuesIncludeVat
      const vatRate = 23
      const vatAmount = showVat ? subtotal * (vatRate / 100) : 0
      const total = subtotal + vatAmount

      const sortedSelections = sortedSelectedList

      const servicePayload = sortedSelections.map((entry, index) => {
        const service = serviceById.get(entry.serviceId)
        if (!service) return null
        const unitPrice = getEffectiveUnitPrice(service.pricingType, service.basePrice, entry.overridePrice)
        const totalPrice = unitPrice === null ? 0 : (unitPrice ?? 0) * (entry.quantity || 1)
        const defaultList = buildIncludedItems(service.includedItems).join("\n").trim() || null
        const baseNotes = entry.notes?.trim() ? entry.notes.trim() : defaultList
        const notes = entry.includeInTotal
          ? baseNotes
          : baseNotes
            ? `${baseNotes} | Opcao apresentada`
            : "Opcao apresentada"

        return {
          service_id: service.id,
          service_name_pt: service.name.pt,
          service_name_en: service.name.en,
          pricing_type: service.pricingType,
          quantity: entry.quantity || 1,
          unit_price: unitPrice === null ? 0 : unitPrice,
          custom_price: entry.overridePrice ?? null,
          total_price: totalPrice,
          notes,
          sort_order: index + 1,
        }
      }).filter(Boolean) as Array<Record<string, unknown>>

      const optionPayload = sortedSelections.flatMap((entry, serviceIndex) => {
        const service = serviceById.get(entry.serviceId)
        if (!service) return []
        const sortedOptions = Object.values(entry.options).sort((a, b) => {
          const optA = service.pricedOptions?.find((opt) => opt.id === a.optionId)
          const optB = service.pricedOptions?.find((opt) => opt.id === b.optionId)
          return (optA?.sortOrder ?? 0) - (optB?.sortOrder ?? 0)
        })

        return sortedOptions.map((optionEntry, index) => {
          const option = service.pricedOptions?.find((opt) => opt.id === optionEntry.optionId)
          if (!option) return null
          const { unitPrice, total: optionTotal } = computeOptionTotals(service, option, optionEntry)
          const baseNotes = optionEntry.notes?.trim() ? optionEntry.notes.trim() : null
          const notes = entry.includeInTotal
            ? baseNotes
            : baseNotes
              ? `${baseNotes} | Opcao apresentada`
              : "Opcao apresentada"

          return {
            service_index: serviceIndex,
            service_priced_option_id: option.id,
            quantity: optionEntry.quantity || 1,
            unit_price: unitPrice === null ? 0 : unitPrice,
            total_price: optionTotal,
            notes,
            sort_order: index + 1,
          }
        }).filter(Boolean)
      })

      const eventTypeNormalized = eventType.trim().toLowerCase()
      const eventTypeValue =
        eventTypeNormalized.includes("casamento")
          ? "wedding"
          : eventTypeNormalized.includes("empresa") || eventTypeNormalized.includes("corporate") || eventTypeNormalized.includes("empresarial")
            ? "corporate"
            : eventTypeNormalized.includes("privad")
              ? "private"
              : "other"

      const payload = {
        status: "sent",
        client_name: clientName || "Cliente",
        client_email: clientEmail || null,
        client_phone: clientPhone || null,
        client_company: clientCompany.trim() || null,
        client_nif: clientNif.trim() || null,
        event_type: eventTypeValue,
        event_type_custom_pt: eventTypeValue === "other" ? eventType : null,
        event_title: eventTitle || null,
        event_date: eventDate || null,
        event_location: eventLocation || null,
        guest_count: Number(guestCount) || 1,
        language: pdfLanguage,
        show_vat: showVat,
        vat_rate: vatRate,
        subtotal,
        vat_amount: vatAmount,
        total,
        custom_intro_pt: contextText || null,
        terms_pt: termsPt.trim() || null,
        terms_en: termsEn.trim() || null,
        services: servicePayload,
        options: optionPayload,
      }

      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Nao foi possivel guardar a proposta.")
      }

      const proposal = await response.json()

      const lang = pdfLanguage === "en" ? "en" : "pt"
      window.open(`/api/proposals/${proposal.id}/pdf?lang=${lang}`, "_blank", "noopener,noreferrer")

      await fetch(`/api/proposals/${proposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "sent", language: pdfLanguage }),
      })

      router.push("/dashboard/proposals")
      router.refresh()
    } catch (error) {
      console.error(error)
      setDownloadError("Nao foi possivel gerar o PDF.")
    } finally {
      setIsSaving(false)
      setIsGenerating(false)
    }
  }

  const renderServiceCard = (service: Service) => {
    const selection = selectedServices[service.id]
    const isSelected = Boolean(selection)

    const effectiveUnit = getEffectiveUnitPrice(service.pricingType, service.basePrice, selection?.overridePrice)
    const unitLabel = getQuantityLabel(service.pricingType, service.unit)

    const includedItems = buildIncludedItems(service.includedItems)
    const options = buildOptions(service.pricedOptions)

    return (
      <Card key={service.id} className="border border-border/60">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id={`service_${service.id}`}
              checked={isSelected}
              onCheckedChange={(value) => toggleService(service.id, value === true)}
            />
            <div className="space-y-1">
              <CardTitle className="text-base">{service.name.pt}</CardTitle>
              {service.description?.pt ? (
                <CardDescription>{service.description.pt}</CardDescription>
              ) : null}
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{pricingTypeLabels[service.pricingType]}</Badge>
                {service.minQuantity ? <span>Min. {service.minQuantity} {unitLabel ?? ""}</span> : null}
              </div>
            </div>
          </div>
          <div className="text-right text-sm">
            {service.pricingType === "on_request" && selection?.overridePrice === undefined ? (
              <span className="font-medium text-muted-foreground">Sob consulta</span>
            ) : (
              <span className="font-semibold">
                {formatCurrency(effectiveUnit ?? 0)}{service.pricingType === "per_person" ? " / pessoa" : ""}
              </span>
            )}
          </div>
        </CardHeader>

        {isSelected ? (
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <div className="space-y-2">
                <Label>Incluir no total</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`include_${service.id}`}
                    checked={selection.includeInTotal}
                    onCheckedChange={(value) => updateServiceField(service.id, { includeInTotal: value === true })}
                  />
                  <span className="text-sm">Esta linha entra no total da proposta</span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`quantity_${service.id}`}>Quantidade</Label>
                <Input
                  id={`quantity_${service.id}`}
                  type="number"
                  min={1}
                  value={selection.quantity}
                  disabled={service.pricingType === "on_request"}
                  onChange={(event) => updateServiceField(service.id, { quantity: Number(event.target.value) || 1 })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`override_${service.id}`}>Preco personalizado (EUR)</Label>
                <Input
                  id={`override_${service.id}`}
                  type="number"
                  step="0.01"
                  value={selection.overridePrice ?? ""}
                  placeholder={service.pricingType === "on_request" ? "Sob consulta" : ""}
                  onChange={(event) => {
                    const value = event.target.value
                    if (value.trim() === "") {
                      updateServiceField(service.id, { overridePrice: undefined })
                      return
                    }
                    const nextValue = Number(value)
                    if (Number.isNaN(nextValue) || nextValue < 0) return
                    updateServiceField(service.id, { overridePrice: nextValue })
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label>Total estimado</Label>
                <div className="rounded-md border px-3 py-2 text-sm">
                  {service.pricingType === "on_request" && selection.overridePrice === undefined
                    ? "Sob consulta"
                    : formatCurrency((effectiveUnit ?? 0) * (selection.quantity || 1))}
                </div>
              </div>
            </div>

            {includedItems.length ? (
              <div className="space-y-2">
                <Label>Inclui</Label>
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {includedItems.map((item, index) => (
                    <li key={`${service.id}_inc_${index}`}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`notes_${service.id}`}>Lista de incluidos (editavel)</Label>
                {selection.notes !== undefined ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateServiceField(service.id, { notes: undefined })}
                  >
                    Usar lista do catalogo
                  </Button>
                ) : null}
              </div>
              <Textarea
                id={`notes_${service.id}`}
                value={selection.notes ?? includedItems.join("\n")}
                onChange={(event) => updateServiceField(service.id, { notes: event.target.value })}
                placeholder="1 item por linha. Se vazio, usa a lista do catalogo."
              />
            </div>

            {options.length ? (
              <div className="space-y-3">
                <Label>Opcoes extras</Label>
                <div className="space-y-3">
                  {options.map((option) => {
                    const optionSelection = selection.options[option.id]
                    const isOptionSelected = Boolean(optionSelection)
                    const optionUnit = getEffectiveUnitPrice(option.pricingType, option.price ?? null, optionSelection?.overridePrice)

                    return (
                      <div key={option.id} className="rounded-md border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id={`option_${service.id}_${option.id}`}
                              checked={isOptionSelected}
                              onCheckedChange={(value) => {
                                if (value !== true) {
                                  updateServiceOption(service.id, option.id, undefined, true)
                                  return
                                }
                                const defaultQty =
                                  option.pricingType === "per_person"
                                    ? (Number.isFinite(guestCountNumber) && guestCountNumber > 0 ? guestCountNumber : 1)
                                    : 1
                                updateServiceOption(service.id, option.id, { quantity: defaultQty })
                              }}
                            />
                            <div>
                              <p className="text-sm font-medium">{option.name.pt}</p>
                              {option.description?.pt ? (
                                <p className="text-xs text-muted-foreground">{option.description.pt}</p>
                              ) : null}
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {option.pricingType === "on_request" && optionSelection?.overridePrice === undefined
                              ? "Sob consulta"
                              : `${formatCurrency(optionUnit ?? 0)}${option.pricingType === "per_person" ? " / pessoa" : ""}`}
                          </div>
                        </div>

                        {isOptionSelected ? (
                          <div className="mt-3 grid gap-3 sm:grid-cols-3">
                            <div className="grid gap-2">
                              <Label htmlFor={`option_qty_${option.id}`}>Quantidade</Label>
                              <Input
                                id={`option_qty_${option.id}`}
                                type="number"
                                min={1}
                                value={optionSelection.quantity}
                                disabled={option.pricingType === "on_request"}
                                onChange={(event) => updateServiceOption(service.id, option.id, { quantity: Number(event.target.value) || 1 })}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label htmlFor={`option_override_${option.id}`}>Preco personalizado (EUR)</Label>
                              <Input
                                id={`option_override_${option.id}`}
                                type="number"
                                step="0.01"
                                value={optionSelection.overridePrice ?? ""}
                                onChange={(event) => {
                                  const value = event.target.value
                                  if (value.trim() === "") {
                                    updateServiceOption(service.id, option.id, { overridePrice: undefined })
                                    return
                                  }
                                  const nextValue = Number(value)
                                  if (Number.isNaN(nextValue) || nextValue < 0) return
                                  updateServiceOption(service.id, option.id, { overridePrice: nextValue })
                                }}
                              />
                            </div>
                            <div className="grid gap-2">
                              <Label>Total</Label>
                              <div className="rounded-md border px-3 py-2 text-sm">
                                {option.pricingType === "on_request" && optionSelection.overridePrice === undefined
                                  ? "Sob consulta"
                                  : formatCurrency((optionUnit ?? 0) * (optionSelection.quantity || 1))}
                              </div>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </CardContent>
        ) : null}
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((label, index) => (
          <Badge key={label} variant={index === step ? "default" : "outline"}>
            {index + 1}. {label}
          </Badge>
        ))}
      </div>

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Cliente</CardTitle>
            <CardDescription>Informacoes do cliente. Pode selecionar um cliente registado ou preencher manualmente. NIF para faturação.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {clients.length > 0 ? (
              <div className="grid gap-2">
                <Label htmlFor="client_select">Selecionar cliente</Label>
                <select
                  id="client_select"
                  value={selectedClientId}
                  onChange={(e) => {
                    const id = e.target.value
                    setSelectedClientId(id)
                    if (id) {
                      const c = clients.find((x) => x.id === id)
                      if (c) {
                        setClientName(c.name)
                        setClientEmail(c.email ?? "")
                        setClientPhone(c.phone ?? "")
                        setClientCompany(c.company ?? "")
                        setClientNif(c.nif ?? "")
                        const address = formatClientAddress(c)
                        if (address) setEventLocation(address)
                      }
                    } else {
                      setClientName("")
                      setClientEmail("")
                      setClientPhone("")
                      setClientCompany("")
                      setClientNif("")
                    }
                  }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">— Novo / preencher manualmente —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.company ? `${c.name} (${c.company})` : c.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            <div className="grid gap-2">
              <Label htmlFor="client_name">Nome</Label>
              <Input id="client_name" value={clientName} onChange={(e) => setClientName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client_email">Email</Label>
                <Input id="client_email" type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client_phone">Telefone</Label>
                <Input
                  id="client_phone"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(sanitizePhoneInput(e.target.value, 15))}
                  inputMode="tel"
                  pattern="\\+?[0-9]*"
                  maxLength={16}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="client_company">Empresa</Label>
                <Input id="client_company" value={clientCompany} onChange={(e) => setClientCompany(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="client_nif">NIF</Label>
                <Input
                  id="client_nif"
                  value={clientNif}
                  onChange={(e) => setClientNif(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={9}
                  placeholder="Para faturação"
                />
                {nifError ? <p className="text-xs text-destructive">{nifError}</p> : null}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>Evento</CardTitle>
            <CardDescription>Detalhes do evento.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="event_title">Titulo do evento</Label>
              <Input id="event_title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event_type">Tipo de evento</Label>
              <Input id="event_type" value={eventType} onChange={(e) => setEventType(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event_date">Data</Label>
              <Input id="event_date" type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="event_location">Local</Label>
              <Input
                id="event_location"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="Morada do evento. Se escolheu um cliente, foi preenchido com a morada das instalações (pode editar)."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="guest_count">Numero de convidados</Label>
              <Input id="guest_count" type="number" min={1} value={guestCount} onChange={(e) => setGuestCount(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Valores apresentados</Label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vat_option"
                    checked={!valuesIncludeVat}
                    onChange={() => setValuesIncludeVat(false)}
                    className="rounded-full border-input"
                  />
                  <span>Sem IVA</span>
                  <span className="text-muted-foreground text-sm">(em PDF em inglês: excluding VAT)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="vat_option"
                    checked={valuesIncludeVat}
                    onChange={() => setValuesIncludeVat(true)}
                    className="rounded-full border-input"
                  />
                  <span>Com IVA</span>
                  <span className="text-muted-foreground text-sm">(em PDF em inglês: including VAT)</span>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>Servicos</CardTitle>
            <CardDescription>Selecione os servicos e opcoes extras.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {sortedCategories.length === 0 ? (
              <div className="space-y-4">
                {services.map(renderServiceCard)}
              </div>
            ) : (
              sortedCategories.map((category) => {
                const list = servicesByCategory.get(category.id) ?? []
                if (list.length === 0) return null
                return (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold">{category.name_pt}</h3>
                      <Separator className="flex-1" />
                    </div>
                    <div className="space-y-4">
                      {list.map(renderServiceCard)}
                    </div>
                  </div>
                )
              })
            )}
            {servicesByCategory.get("uncategorized")?.length ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold">Outros</h3>
                  <Separator className="flex-1" />
                </div>
                <div className="space-y-4">
                  {servicesByCategory.get("uncategorized")?.map(renderServiceCard)}
                </div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {step === 3 ? (
        <Card>
          <CardHeader>
            <CardTitle>Conteudo</CardTitle>
            <CardDescription>Texto adicional e condicoes gerais.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="context">Enquadramento (opcional)</Label>
              <Textarea
                id="context"
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Descreva o enquadramento do servico."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="terms_template">Modelo de condicoes gerais</Label>
              <select
                id="terms_template"
                value={termsTemplateId}
                onChange={(e) => handleTemplateChange(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">— Nenhum / preencher manualmente —</option>
                {termsTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Crie mais modelos em Configurações. Cada modelo tem versão PT e EN para o PDF.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="terms_pt">Condicoes gerais (Português)</Label>
              <Textarea
                id="terms_pt"
                value={termsPt}
                onChange={(e) => setTermsPt(e.target.value)}
                rows={6}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="terms_en">Condicoes gerais (English)</Label>
              <Textarea
                id="terms_en"
                value={termsEn}
                onChange={(e) => setTermsEn(e.target.value)}
                rows={6}
              />
            </div>
          </CardContent>
        </Card>
      ) : null}

      {step === 4 ? (
        <Card>
          <CardHeader>
            <CardTitle>Resumo</CardTitle>
            <CardDescription>Confirme os dados e gere o PDF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Ordem dos artigos no PDF</Label>
                <p className="text-xs text-muted-foreground">Altere a ordem para exportar exatamente como pretende.</p>
                <div className="rounded-md border border-border bg-muted/30 p-2 space-y-1 max-h-48 overflow-y-auto">
                  {serviceOrder.map((id, index) => {
                    const service = serviceById.get(id)
                    if (!service) return null
                    return (
                      <div
                        key={id}
                        className="flex items-center justify-between gap-2 rounded bg-background px-2 py-1.5 text-sm"
                      >
                        <span className="font-medium truncate">{service.name.pt}</span>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveServiceInOrder(index, -1)}
                            disabled={index === 0}
                            aria-label="Subir"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveServiceInOrder(index, 1)}
                            disabled={index === serviceOrder.length - 1}
                            aria-label="Descer"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pdf_lang">Idioma do PDF</Label>
                <p className="text-xs text-muted-foreground">Títulos e textos do documento serão gerados neste idioma.</p>
                <select
                  id="pdf_lang"
                  value={pdfLanguage}
                  onChange={(e) => setPdfLanguage(e.target.value as "pt" | "en")}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <ProposalPreview data={previewData} />
            {saveError ? <div className="text-sm text-destructive">{saveError}</div> : null}
            {downloadError ? <div className="text-sm text-destructive">{downloadError}</div> : null}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Subtotal: <span className="font-semibold text-foreground">{formatCurrency(subtotal)}</span>
              </div>
              <Button onClick={handleDownloadPdf} disabled={isGenerating || isSaving}>
                {isGenerating || isSaving ? "A gerar..." : "Aprovar e gerar PDF"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => setStep((prev) => Math.max(0, prev - 1))} disabled={step === 0}>
          Anterior
        </Button>
        <Button onClick={() => setStep((prev) => Math.min(steps.length - 1, prev + 1))} disabled={step === steps.length - 1}>
          Proximo
        </Button>
      </div>
    </div>
  )
}
