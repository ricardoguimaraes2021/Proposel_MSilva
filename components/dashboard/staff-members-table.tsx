"use client"

import { Edit, Trash2, Phone, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { StaffMember } from "./staff-view"
import { formatDateShort } from "@/lib/utils"

interface StaffMembersTableProps {
    members: StaffMember[]
    onEdit: (member: StaffMember) => void
    onDelete: (id: string) => void
    onHistory: (member: StaffMember) => void
    upcomingByStaff: Record<string, {
        id: string
        title: string
        eventDate: string
        clientName: string | null
    }[]>
}

export function StaffMembersTable({ members, onEdit, onDelete, onHistory, upcomingByStaff }: StaffMembersTableProps) {
    if (members.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground">
                <p>Nenhum funcionário registado.</p>
                <p className="text-sm">Clique em &quot;Novo Funcionário&quot; para adicionar.</p>
            </div>
        )
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="border-b text-left text-sm text-muted-foreground">
                        <th className="pb-3 font-medium">Nome</th>
                        <th className="pb-3 font-medium">Telefone</th>
                        <th className="pb-3 font-medium">NIF</th>
                        <th className="pb-3 font-medium">Funções</th>
                        <th className="pb-3 font-medium">Próximos serviços</th>
                        <th className="pb-3 font-medium text-right">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y">
                    {members.map((member) => (
                        <tr key={member.id} className="hover:bg-muted/50 transition-colors">
                            <td className="py-3">
                                <div className="font-medium">
                                    {member.first_name} {member.last_name}
                                </div>
                            </td>
                            <td className="py-3">
                                {member.phone ? (
                                    <span className="flex items-center gap-1 text-sm">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        {member.phone}
                                    </span>
                                ) : (
                                    <span className="text-muted-foreground text-sm">—</span>
                                )}
                            </td>
                            <td className="py-3 text-sm">
                                {member.nif || <span className="text-muted-foreground">—</span>}
                            </td>
                            <td className="py-3">
                                <div className="flex flex-wrap gap-1">
                                    {member.roles.map((mr) => (
                                        <Badge key={mr.id} variant="secondary" className="text-xs">
                                            {mr.staff_roles?.name ?? "?"}
                                            {mr.custom_hourly_rate != null && (
                                                <span className="ml-1 opacity-70">
                                                    ({mr.custom_hourly_rate}€/h)
                                                </span>
                                            )}
                                        </Badge>
                                    ))}
                                    {member.roles.length === 0 && (
                                        <span className="text-muted-foreground text-sm">Sem funções</span>
                                    )}
                                </div>
                            </td>
                            <td className="py-3 text-sm">
                                {(() => {
                                    const upcoming = upcomingByStaff[member.id] ?? []
                                    if (upcoming.length === 0) {
                                        return <span className="text-muted-foreground">Sem serviços futuros</span>
                                    }
                                    return (
                                        <div className="space-y-1">
                                            {upcoming.slice(0, 3).map((s) => (
                                                <div key={s.id} className="text-xs">
                                                    <span className="font-medium">{formatDateShort(s.eventDate)}</span>
                                                    <span className="text-muted-foreground"> · {s.title}</span>
                                                    {s.clientName ? (
                                                        <span className="text-muted-foreground"> · {s.clientName}</span>
                                                    ) : null}
                                                </div>
                                            ))}
                                            {upcoming.length > 3 ? (
                                                <span className="text-xs text-muted-foreground">
                                                    +{upcoming.length - 3} mais
                                                </span>
                                            ) : null}
                                        </div>
                                    )
                                })()}
                            </td>
                            <td className="py-3 text-right">
                                <div className="flex gap-1 justify-end">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(member)}
                                        title="Editar"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onHistory(member)}
                                        title="Histórico"
                                    >
                                        <History className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => {
                                            if (confirm(`Desativar ${member.first_name} ${member.last_name}?`)) {
                                                onDelete(member.id)
                                            }
                                        }}
                                        title="Desativar"
                                        className="text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
