"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Users, Briefcase, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { StaffMembersTable } from "./staff-members-table"
import { StaffMemberDialog } from "./staff-member-dialog"
import { StaffRolesSection } from "./staff-roles-section"
import { StaffMonthlySummary } from "./staff-monthly-summary"
import { StaffHistoryDialog } from "./staff-history-dialog"

export interface StaffRole {
    id: string
    name: string
    default_hourly_rate: number
    is_active: boolean
    sort_order: number
}

export interface StaffMemberRole {
    id: string
    staff_member_id: string
    role_id: string
    custom_hourly_rate: number | null
    staff_roles: StaffRole
}

export interface StaffMember {
    id: string
    first_name: string
    last_name: string
    phone: string | null
    nif: string | null
    notes: string | null
    is_active: boolean
    roles: StaffMemberRole[]
}

export function StaffView() {
    const [members, setMembers] = useState<StaffMember[]>([])
    const [roles, setRoles] = useState<StaffRole[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingMember, setEditingMember] = useState<StaffMember | null>(null)
    const [historyOpen, setHistoryOpen] = useState(false)
    const [historyMember, setHistoryMember] = useState<StaffMember | null>(null)
    const [mounted, setMounted] = useState(false)
    const [upcomingByStaff, setUpcomingByStaff] = useState<Record<string, {
        id: string
        title: string
        eventDate: string
        clientName: string | null
    }[]>>({})
    const [search, setSearch] = useState("")

    const fetchRoles = useCallback(async () => {
        const res = await fetch("/api/staff-roles")
        if (res.ok) {
            const data = await res.json()
            setRoles(data)
        }
    }, [])

    const fetchMembers = useCallback(async () => {
        const res = await fetch("/api/staff-members")
        if (res.ok) {
            const data = await res.json()
            setMembers(data.filter((m: StaffMember) => m.is_active))
        }
    }, [])

    const fetchUpcoming = useCallback(async () => {
        const res = await fetch("/api/staff-upcoming")
        if (res.ok) {
            setUpcomingByStaff(await res.json())
        }
    }, [])

    useEffect(() => {
        Promise.all([fetchRoles(), fetchMembers(), fetchUpcoming()]).then(() => setLoading(false))
    }, [fetchRoles, fetchMembers, fetchUpcoming])

    useEffect(() => {
        setMounted(true)
    }, [])

    const handleCreateMember = () => {
        setEditingMember(null)
        setDialogOpen(true)
    }

    const handleEditMember = (member: StaffMember) => {
        setEditingMember(member)
        setDialogOpen(true)
    }

    const handleHistoryMember = (member: StaffMember) => {
        setHistoryMember(member)
        setHistoryOpen(true)
    }

    const handleMemberSaved = () => {
        setDialogOpen(false)
        setEditingMember(null)
        fetchMembers()
    }

    const handleDeleteMember = async (id: string) => {
        await fetch(`/api/staff-members/${id}`, { method: "DELETE" })
        fetchMembers()
    }

    const activeRoles = roles.filter((r) => r.is_active)
    const normalizedSearch = search.trim().toLowerCase()
    const filteredMembers = normalizedSearch
        ? members.filter((m) => {
            const name = `${m.first_name} ${m.last_name}`.toLowerCase()
            const phone = (m.phone ?? "").toLowerCase()
            const nif = (m.nif ?? "").toLowerCase()
            return name.includes(normalizedSearch) || phone.includes(normalizedSearch) || nif.includes(normalizedSearch)
        })
        : members

    if (!mounted) {
        return <div className="text-center text-muted-foreground py-8">A carregar...</div>
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="h-7 w-7" /> Staff
                    </h1>
                    <p className="text-muted-foreground">
                        Gerir funcionários, funções e escalas de serviço
                    </p>
                </div>
            </div>

            <Tabs defaultValue="members" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="members" className="gap-2">
                        <Users className="h-4 w-4" />
                        Funcionários
                    </TabsTrigger>
                    <TabsTrigger value="roles" className="gap-2">
                        <Briefcase className="h-4 w-4" />
                        Funções
                    </TabsTrigger>
                    <TabsTrigger value="summary" className="gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Resumo Mensal
                    </TabsTrigger>
                </TabsList>

                {/* Tab Funcionários */}
                <TabsContent value="members">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Funcionários ({members.length})</CardTitle>
                            <Button onClick={handleCreateMember} className="gap-2">
                                <Plus className="h-4 w-4" />
                                Novo Funcionário
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="mb-4">
                                <Input
                                    placeholder="Pesquisar funcionário..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="max-w-sm"
                                />
                            </div>
                            {loading ? (
                                <p className="text-center text-muted-foreground py-8">A carregar...</p>
                            ) : (
                                <StaffMembersTable
                                    members={filteredMembers}
                                    onEdit={handleEditMember}
                                    onDelete={handleDeleteMember}
                                    onHistory={handleHistoryMember}
                                    upcomingByStaff={upcomingByStaff}
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab Funções */}
                <TabsContent value="roles">
                    <StaffRolesSection roles={roles} onRolesChanged={fetchRoles} />
                </TabsContent>

                {/* Tab Resumo */}
                <TabsContent value="summary">
                    <StaffMonthlySummary />
                </TabsContent>
            </Tabs>

            {/* Dialog criar/editar funcionário */}
            <StaffMemberDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                member={editingMember}
                availableRoles={activeRoles}
                onSaved={handleMemberSaved}
            />

            <StaffHistoryDialog
                open={historyOpen}
                onOpenChange={setHistoryOpen}
                member={historyMember}
            />
        </div>
    )
}
