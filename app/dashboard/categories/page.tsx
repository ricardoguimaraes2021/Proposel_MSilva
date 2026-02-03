import { createClient } from "@/lib/supabase/server"
import { CategoriesTable } from "@/components/dashboard/categories-table"
import { ServiceCategory } from "@/types"
import { CategoryDialog } from "@/components/dashboard/category-dialog"

export default async function CategoriesPage() {
    const supabase = await createClient()
    const { data: categories, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("sort_order", { ascending: true })

    if (error) {
        console.error("Error fetching categories:", error)
        return <div>Erro ao carregar categorias.</div>
    }

    // Type assertion or mapping if needed (Supabase returns snake_case, interface assumes camelCase if we strictly follow types.ts)
    // But wait, my interface uses camelCase. Supabase returns snake_case columns.
    // I need to map it or update types/index.ts to match DB column names for simpler mapping, OR map here.
    // For MVP speed, let's update types to match DB or map it.
    // The PRD model had camelCase, but the SQL has snake_case (e.g. sort_order, is_active).

    // Mapping for display:
    const mappedCategories: ServiceCategory[] = (categories || []).map(c => ({
        id: c.id,
        name: { pt: c.name_pt, en: c.name_en },
        description: { pt: c.description_pt, en: c.description_en },
        icon: c.icon,
        sortOrder: c.sort_order,
        isActive: c.is_active
    }))

    return (
        <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Categorias de Serviços</h1>
                <CategoryDialog />
            </div>
            <CategoriesTable categories={mappedCategories} />
        </div>
    )
}
