import { Suspense } from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { StaffView } from "@/components/dashboard/staff-view"

export default async function StaffPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect("/auth/login")

    return (
        <div className="p-6 max-w-6xl mx-auto">
            <Suspense fallback={<div className="text-center py-12">A carregar...</div>}>
                <StaffView />
            </Suspense>
        </div>
    )
}
