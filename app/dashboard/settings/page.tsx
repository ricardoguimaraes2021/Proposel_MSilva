import { createClient } from "@/lib/supabase/server"
import { CompanyProfileForm, type CompanyProfileFormValues } from "@/components/dashboard/company-profile-form"
import { TermsTemplatesSection, type TermsTemplateRow } from "@/components/dashboard/terms-templates-section"

type CompanyProfileRow = {
    id: string
    name: string
    tagline_pt: string | null
    tagline_en: string | null
    logo_url: string | null
    contact_phone: string | null
    contact_email: string | null
    contact_website: string | null
    contact_instagram: string | null
    contact_facebook: string | null
    address_street: string | null
    address_city: string | null
    address_postal_code: string | null
    address_country: string | null
}

export default async function SettingsPage() {
    const supabase = await createClient()
    const [
        { data: profileData, error: profileError },
        { data: termsTemplates, error: termsError },
    ] = await Promise.all([
        supabase.from("company_profile").select("*").order("updated_at", { ascending: false }).limit(1),
        supabase.from("terms_templates").select("*").order("name", { ascending: true }),
    ])

    if (profileError) {
        console.error("Error fetching company profile:", profileError)
        return <div>Erro ao carregar configuracoes.</div>
    }

    const data = profileData

    const profileRow = (data?.[0] as CompanyProfileRow | undefined) ?? null
    const templates: TermsTemplateRow[] = (termsError ? [] : termsTemplates ?? []).map((t: Record<string, unknown>) => ({
        id: t.id as string,
        name: t.name as string,
        content_pt: (t.content_pt as string) ?? "",
        content_en: (t.content_en as string) ?? "",
        is_default: t.is_default as boolean | null,
    }))

    const initialData: CompanyProfileFormValues | null = profileRow
        ? {
            id: profileRow.id,
            name: profileRow.name ?? "MSilva",
            tagline_pt: profileRow.tagline_pt ?? "",
            tagline_en: profileRow.tagline_en ?? "",
            logo_url: profileRow.logo_url ?? "",
            contact_phone: profileRow.contact_phone ?? "",
            contact_email: profileRow.contact_email ?? "",
            contact_website: profileRow.contact_website ?? "",
            contact_instagram: profileRow.contact_instagram ?? "",
            contact_facebook: profileRow.contact_facebook ?? "",
            address_street: profileRow.address_street ?? "",
            address_city: profileRow.address_city ?? "",
            address_postal_code: profileRow.address_postal_code ?? "",
            address_country: profileRow.address_country ?? "Portugal",
        }
        : null

    return (
        <div className="flex flex-1 flex-col gap-6 p-6">
            <div>
                <h1 className="text-2xl font-bold">Configuracoes</h1>
                <p className="text-muted-foreground">Perfil da empresa e definicoes gerais.</p>
            </div>
            <CompanyProfileForm initialData={initialData} />
            <TermsTemplatesSection templates={templates} />
        </div>
    )
}
