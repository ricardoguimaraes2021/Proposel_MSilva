import { createClient } from "@/lib/supabase/server"
import { PricingType, Service } from "@/types"
import { ServiceDialog } from "@/components/dashboard/service-dialog"
import { ServicesTable } from "@/components/dashboard/services-table"

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
  text_pt: string
  text_en: string
  sort_order: number
}

type PricedOptionRow = {
  id: string
  service_id: string
}

type ServiceWithMeta = Service & {
  categoryName?: string
  includedCount: number
  optionsCount: number
}

export default async function ServicesPage() {
  const supabase = await createClient()

  const [
    { data: services, error: servicesError },
    { data: categories, error: categoriesError },
    { data: includedItems, error: includedError },
    { data: pricedOptions, error: optionsError },
  ] = await Promise.all([
    supabase.from("services").select("*").order("sort_order", { ascending: true }),
    supabase.from("service_categories").select("*").order("sort_order", { ascending: true }),
    supabase.from("service_included_items").select("id, service_id, text_pt, text_en, sort_order").order("sort_order", { ascending: true }),
    supabase.from("service_priced_options").select("id, service_id"),
  ])

  if (servicesError || categoriesError || includedError || optionsError) {
    console.error("Error fetching services:", servicesError)
    console.error("Error fetching categories:", categoriesError)
    console.error("Error fetching included items:", includedError)
    console.error("Error fetching priced options:", optionsError)
    return <div>Erro ao carregar serviços.</div>
  }

  const serviceRows = (services ?? []) as ServiceRow[]
  const categoryRows = (categories ?? []) as CategoryRow[]
  const includedRows = (includedItems ?? []) as IncludedItemRow[]
  const optionRows = (pricedOptions ?? []) as PricedOptionRow[]

  const categoryMap = new Map(categoryRows.map((category) => [category.id, category]))
  const includedCount = new Map<string, number>()
  const includedItemsByService = new Map<string, { id: string; serviceId: string; sectionKey: string; text: { pt: string; en: string }; sortOrder: number }[]>()
  const optionCount = new Map<string, number>()

  includedRows.forEach((row) => {
    includedCount.set(row.service_id, (includedCount.get(row.service_id) ?? 0) + 1)
    const list = includedItemsByService.get(row.service_id) ?? []
    list.push({
      id: row.id,
      serviceId: row.service_id,
      sectionKey: "default",
      text: { pt: row.text_pt, en: row.text_en },
      sortOrder: row.sort_order,
    })
    includedItemsByService.set(row.service_id, list)
  })

  optionRows.forEach((row) => {
    optionCount.set(row.service_id, (optionCount.get(row.service_id) ?? 0) + 1)
  })

  function getIncludedItems(service: ServiceRow) {
    const fromTable = includedItemsByService.get(service.id)
    if (fromTable?.length) return fromTable
    const pt = service.included_items_pt ?? []
    const en = service.included_items_en ?? []
    if (pt.length === 0 && en.length === 0) return []
    return pt.map((textPt, i) => ({
      id: `arr-${service.id}-${i}`,
      serviceId: service.id,
      sectionKey: "default",
      text: { pt: textPt, en: en[i] ?? textPt },
      sortOrder: i,
    }))
  }

  const mappedServices: ServiceWithMeta[] = serviceRows.map((service) => ({
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
    includedItems: getIncludedItems(service),
    includedCount: includedCount.get(service.id) ?? 0,
    optionsCount: optionCount.get(service.id) ?? 0,
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Serviços</h1>
          <p className="text-muted-foreground">Gestão do catálogo de serviços.</p>
        </div>
        <ServiceDialog categories={categoryRows} />
      </div>
      <ServicesTable services={mappedServices} categories={categoryRows} />
    </div>
  )
}
