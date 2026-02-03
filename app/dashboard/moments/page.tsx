import { createClient } from "@/lib/supabase/server"
import { MomentDialog } from "@/components/dashboard/moment-dialog"
import { MomentsTable, type MomentRow } from "@/components/dashboard/moments-table"
import type { CatalogItem, PricingType } from "@/types"
import type { MomentItemRow } from "@/components/dashboard/moment-items-dialog"

type CatalogRow = {
  id: number
  name_pt: string
  name_en: string
  description_pt: string | null
  description_en: string | null
  pricing_type: PricingType
  base_price: number | string | null
  unit_pt: string | null
  unit_en: string | null
  min_quantity: number | null
  tags: string[] | null
  sort_order: number
  is_active: boolean
}

export default async function MomentsPage() {
  const supabase = await createClient()
  const [
    { data: moments, error: momentsError },
    { data: items, error: itemsError },
    { data: momentItems, error: momentItemsError },
  ] = await Promise.all([
    supabase
      .from("proposal_moments")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("catalog_items")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("moment_items")
      .select("moment_id,item_id,is_default,sort_order"),
  ])

  if (momentsError || itemsError || momentItemsError) {
    console.error("Error fetching moments:", momentsError)
    console.error("Error fetching catalog items:", itemsError)
    console.error("Error fetching moment items:", momentItemsError)
    return <div>Erro ao carregar momentos.</div>
  }

  const momentRows = (moments ?? []) as MomentRow[]
  const itemRows = (items ?? []) as CatalogRow[]
  const momentItemRows = (momentItems ?? []) as MomentItemRow[]

  const mappedItems: CatalogItem[] = itemRows.map((item) => ({
    id: item.id,
    name: { pt: item.name_pt, en: item.name_en },
    description: item.description_pt || item.description_en
      ? { pt: item.description_pt ?? "", en: item.description_en ?? "" }
      : undefined,
    pricingType: item.pricing_type,
    basePrice: item.base_price === null ? null : Number(item.base_price),
    unit: item.unit_pt || item.unit_en ? { pt: item.unit_pt ?? "", en: item.unit_en ?? "" } : undefined,
    minQuantity: item.min_quantity ?? undefined,
    tags: item.tags ?? undefined,
    sortOrder: item.sort_order,
    isActive: item.is_active,
  }))

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Momentos</h1>
          <p className="text-muted-foreground">Gestao dos momentos e sugestoes de itens.</p>
        </div>
        <MomentDialog />
      </div>
      <MomentsTable moments={momentRows} catalogItems={mappedItems} momentItems={momentItemRows} />
    </div>
  )
}
