import { createClient } from "@/lib/supabase/server"
import { ProposalWizard } from "@/components/dashboard/proposal-wizard"
import { PricingType, Service, ServiceIncludedItem, ServicePricedOption } from "@/types"

type ServiceRow = {
  id: string
  category_id: string | null
  name_pt: string
  name_en: string
  description_pt: string | null
  description_en: string | null
  included_items_pt?: string[] | null
  included_items_en?: string[] | null
  pricing_type: PricingType
  base_price: number | string | null
  unit_pt: string | null
  unit_en: string | null
  min_quantity: number | null
  max_quantity: number | null
  tags: string[] | null
  sort_order: number
  is_active: boolean
}

type CategoryRow = {
  id: string
  name_pt: string
  name_en: string
  sort_order: number | null
  is_active: boolean | null
}

type IncludedItemRow = {
  id: string
  service_id: string
  section_key: string
  text_pt: string
  text_en: string
  sort_order: number
}

type PricedOptionRow = {
  id: string
  service_id: string
  name_pt: string
  name_en: string
  description_pt: string | null
  description_en: string | null
  pricing_type: PricingType
  price: number | string | null
  min_quantity: number | null
  sort_order: number
}

type ClientRow = {
  id: string
  name: string
  email: string | null
  phone: string | null
  company: string | null
  nif: string | null
  address_street: string | null
  address_city: string | null
  address_postal_code: string | null
  address_country: string | null
}

export default async function NewProposalPage() {
  const supabase = await createClient()
  const [
    { data: services, error: servicesError },
    { data: categories, error: categoriesError },
    { data: includedItems, error: includedError },
    { data: pricedOptions, error: optionsError },
    { data: companyProfile, error: companyError },
    { data: clients, error: clientsError },
    { data: termsTemplates, error: termsError },
  ] = await Promise.all([
    supabase
      .from("services")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("service_categories")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("service_included_items")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("service_priced_options")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("company_profile")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1),
    supabase
      .from("clients")
      .select("id, name, email, phone, company, nif, address_street, address_city, address_postal_code, address_country")
      .order("name", { ascending: true }),
    supabase
      .from("terms_templates")
      .select("id, name, content_pt, content_en")
      .order("name", { ascending: true }),
  ])

  if (servicesError || categoriesError || includedError || optionsError || companyError || clientsError || termsError) {
    console.error("Error fetching services:", servicesError)
    console.error("Error fetching categories:", categoriesError)
    console.error("Error fetching included items:", includedError)
    console.error("Error fetching priced options:", optionsError)
    console.error("Error fetching company profile:", companyError)
    console.error("Error fetching clients:", clientsError)
    console.error("Error fetching terms templates:", termsError)
    return <div>Erro ao carregar dados.</div>
  }

  type TermsTemplateOption = { id: string; name: string; content_pt: string; content_en: string }
  const termsTemplatesList: TermsTemplateOption[] = (termsTemplates ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    name: t.name as string,
    content_pt: (t.content_pt as string) ?? "",
    content_en: (t.content_en as string) ?? "",
  }))

  const serviceRows = (services ?? []) as ServiceRow[]
  const categoryRows = (categories ?? []) as CategoryRow[]
  const includedRows = (includedItems ?? []) as IncludedItemRow[]
  const optionsRows = (pricedOptions ?? []) as PricedOptionRow[]

  const includedMap = new Map<string, ServiceIncludedItem[]>()
  includedRows.forEach((row) => {
    const entry = includedMap.get(row.service_id) ?? []
    entry.push({
      id: row.id,
      serviceId: row.service_id,
      sectionKey: row.section_key,
      text: { pt: row.text_pt, en: row.text_en },
      sortOrder: row.sort_order,
    })
    includedMap.set(row.service_id, entry)
  })

  /** Se o servico nao tem itens em service_included_items, usa descricao ou included_items_pt/en (lista por linha). */
  function getIncludedItemsForService(service: ServiceRow): ServiceIncludedItem[] {
    const fromTable = (includedMap.get(service.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder)
    if (fromTable.length > 0) return fromTable

    const ptLines: string[] = Array.isArray(service.included_items_pt) && service.included_items_pt.length > 0
      ? service.included_items_pt.filter(Boolean)
      : (service.description_pt ?? "")
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean)
    if (ptLines.length === 0) return []

    const enLines: string[] = Array.isArray(service.included_items_en) && service.included_items_en.length > 0
      ? service.included_items_en.filter(Boolean)
      : (service.description_en ?? "")
          .split(/\n+/)
          .map((l) => l.trim())
          .filter(Boolean)

    return ptLines.map((textPt, i) => ({
      id: `desc-${service.id}-${i}`,
      serviceId: service.id,
      sectionKey: "default",
      text: { pt: textPt, en: enLines[i] ?? textPt },
      sortOrder: i,
    }))
  }

  const optionsMap = new Map<string, ServicePricedOption[]>()
  optionsRows.forEach((row) => {
    const entry = optionsMap.get(row.service_id) ?? []
    entry.push({
      id: row.id,
      serviceId: row.service_id,
      name: { pt: row.name_pt, en: row.name_en },
      description: row.description_pt || row.description_en
        ? { pt: row.description_pt ?? "", en: row.description_en ?? "" }
        : undefined,
      pricingType: row.pricing_type,
      price: row.price === null ? null : Number(row.price),
      minQuantity: row.min_quantity ?? undefined,
      sortOrder: row.sort_order,
    })
    optionsMap.set(row.service_id, entry)
  })

  const categoryMap = new Map(categoryRows.map((category) => [category.id, category]))

  const mappedServices: Service[] = serviceRows.map((service) => ({
    id: service.id,
    categoryId: service.category_id ?? "",
    category: service.category_id
      ? {
          id: service.category_id,
          name: {
            pt: categoryMap.get(service.category_id)?.name_pt ?? "",
            en: categoryMap.get(service.category_id)?.name_en ?? "",
          },
          sortOrder: categoryMap.get(service.category_id)?.sort_order ?? 0,
          isActive: categoryMap.get(service.category_id)?.is_active ?? true,
        }
      : null,
    name: { pt: service.name_pt, en: service.name_en },
    description: service.description_pt || service.description_en
      ? { pt: service.description_pt ?? "", en: service.description_en ?? "" }
      : undefined,
    pricingType: service.pricing_type,
    basePrice: service.base_price === null ? null : Number(service.base_price),
    unit: service.unit_pt || service.unit_en ? { pt: service.unit_pt ?? "", en: service.unit_en ?? "" } : undefined,
    minQuantity: service.min_quantity ?? undefined,
    maxQuantity: service.max_quantity ?? undefined,
    tags: service.tags ?? undefined,
    sortOrder: service.sort_order,
    isActive: service.is_active,
    includedItems: getIncludedItemsForService(service),
    pricedOptions: (optionsMap.get(service.id) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
  }))

  const company = companyProfile?.[0] as
    | {
        name?: string
        tagline_pt?: string | null
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
    | undefined

  const addressParts = [
    company?.address_street,
    [company?.address_postal_code, company?.address_city].filter(Boolean).join(" "),
    company?.address_country,
  ].filter(Boolean)

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Nova Proposta</h1>
        <p className="text-muted-foreground">Preencha os dados para gerar uma nova proposta.</p>
      </div>
      <ProposalWizard
        services={mappedServices}
        categories={categoryRows}
        clients={(clients ?? []) as ClientRow[]}
        termsTemplates={termsTemplatesList}
        companyName={company?.name || "MSilva"}
        companyTagline={company?.tagline_pt || undefined}
        companyLogoUrl={company?.logo_url || undefined}
        companyContact={{
          phone: company?.contact_phone || undefined,
          email: company?.contact_email || undefined,
          website: company?.contact_website || undefined,
          instagram: company?.contact_instagram || undefined,
          facebook: company?.contact_facebook || undefined,
          address: addressParts.length ? addressParts.join(", ") : undefined,
        }}
      />
    </div>
  )
}
