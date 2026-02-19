import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import { StaffClockView } from "@/components/dashboard/staff-clock-view"

async function ClockPageContent() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    return <StaffClockView />
}

export default function ClockPage() {
    return (
        <div className="p-8">
            <Suspense fallback={<div className="p-8">A carregar relógio de ponto...</div>}>
                <ClockPageContent />
            </Suspense>
        </div>
    )
}
