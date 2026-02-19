import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Suspense } from "react"
import { CalendarView } from "@/components/dashboard/calendar-view"

async function CalendarPageContent() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect("/auth/login")
    }

    return <CalendarView />
}

export default function CalendarPage() {
    return (
        <div className="p-8">
            <Suspense fallback={<div className="p-8">A carregar calendário...</div>}>
                <CalendarPageContent />
            </Suspense>
        </div>
    )
}
