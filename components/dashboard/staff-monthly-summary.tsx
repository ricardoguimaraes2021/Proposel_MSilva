"use client"

import { useState, useEffect, useCallback, Fragment } from "react"
import { ChevronLeft, ChevronRight, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDateShort } from "@/lib/utils"

interface StaffServiceSummary {
    id: string
    role: string
    hoursWorked: number | null
    totalPay: number | null
    startTime: string | null
    endTime: string | null
    title: string | null
    eventDate: string | null
}

interface StaffSummaryItem {
    staffId: string
    name: string
    totalHours: number
    totalPay: number
    services: StaffServiceSummary[]
}

interface MonthlySummary {
    month: string
    staffCount: number
    totalHours: number
    totalPay: number
    staff: StaffSummaryItem[]
}

export function StaffMonthlySummary() {
    const [currentMonth, setCurrentMonth] = useState(() => {
        const now = new Date()
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
    })
    const [summary, setSummary] = useState<MonthlySummary | null>(null)
    const [loading, setLoading] = useState(true)
    const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null)

    const fetchSummary = useCallback(async () => {
        setLoading(true)
        const res = await fetch(`/api/staff-summary?month=${currentMonth}`)
        if (res.ok) {
            setSummary(await res.json())
        }
        setLoading(false)
    }, [currentMonth])

    useEffect(() => {
        fetchSummary()
    }, [fetchSummary])

    const navigateMonth = (dir: number) => {
        const [year, month] = currentMonth.split("-").map(Number)
        const d = new Date(year, month - 1 + dir, 1)
        setCurrentMonth(
            `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        )
    }

    const monthLabel = (() => {
        const [year, month] = currentMonth.split("-").map(Number)
        const d = new Date(year, month - 1, 1)
        return formatDateShort(d)
    })()

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>Resumo Mensal</CardTitle>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <span className="min-w-[160px] text-center font-medium capitalize">
                            {monthLabel}
                        </span>
                        <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <p className="text-center text-muted-foreground py-8">A carregar...</p>
                ) : !summary || summary.staff.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                        Sem registos de horas para este mês.
                    </p>
                ) : (
                    <div className="space-y-4">
                        {/* Totais */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="rounded-md border p-3 text-center">
                                <p className="text-2xl font-bold">{summary.staffCount}</p>
                                <p className="text-sm text-muted-foreground">Funcionários</p>
                            </div>
                            <div className="rounded-md border p-3 text-center">
                                <p className="text-2xl font-bold">{summary.totalHours.toFixed(1)}h</p>
                                <p className="text-sm text-muted-foreground">Total Horas</p>
                            </div>
                            <div className="rounded-md border p-3 text-center">
                                <p className="text-2xl font-bold">{summary.totalPay.toFixed(2)}€</p>
                                <p className="text-sm text-muted-foreground">Total a Pagar</p>
                            </div>
                        </div>

                        {/* Tabela por funcionário */}
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b text-left text-sm text-muted-foreground">
                                        <th className="pb-3 font-medium">Funcionário</th>
                                        <th className="pb-3 font-medium text-center">Serviços</th>
                                        <th className="pb-3 font-medium text-right">Horas</th>
                                        <th className="pb-3 font-medium text-right">A Pagar</th>
                                        <th className="pb-3 font-medium text-right">Detalhes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {summary.staff.map((s) => (
                                        <Fragment key={s.staffId}>
                                            <tr className="hover:bg-muted/50 transition-colors">
                                                <td className="py-3 font-medium">{s.name}</td>
                                                <td className="py-3 text-center text-sm">{s.services.length}</td>
                                                <td className="py-3 text-right font-mono text-sm">
                                                    {s.totalHours.toFixed(1)}h
                                                </td>
                                                <td className="py-3 text-right font-mono font-medium">
                                                    {s.totalPay.toFixed(2)}€
                                                </td>
                                                <td className="py-3 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            setExpandedStaffId((prev) =>
                                                                prev === s.staffId ? null : s.staffId
                                                            )
                                                        }
                                                        title="Ver serviços"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </td>
                                            </tr>
                                            {expandedStaffId === s.staffId && (
                                                <tr className="bg-muted/20">
                                                    <td colSpan={5} className="py-3">
                                                        {s.services.length === 0 ? (
                                                            <p className="text-sm text-muted-foreground">Sem serviços.</p>
                                                        ) : (
                                                            <div className="grid gap-2">
                                                                {s.services.map((svc) => (
                                                                    <div key={svc.id} className="text-sm">
                                                                        <span className="font-medium">
                                                                            {svc.eventDate ? formatDateShort(svc.eventDate) : "—"}
                                                                        </span>
                                                                        <span className="text-muted-foreground">
                                                                            {" "}· {svc.title || "Serviço"}
                                                                        </span>
                                                                        {svc.hoursWorked != null ? (
                                                                            <span className="text-muted-foreground">
                                                                                {" "}· {svc.hoursWorked.toFixed(2)}h
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
