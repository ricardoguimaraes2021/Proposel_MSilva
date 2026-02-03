"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useRouter } from "next/navigation"
import type { CatalogItem } from "@/types"
import { MomentEditDialog } from "@/components/dashboard/moment-edit-dialog"
import { MomentItemsDialog, type MomentItemRow } from "@/components/dashboard/moment-items-dialog"

export type MomentRow = {
  id: number
  key: string
  title_pt: string
  title_en: string
  sort_order: number
  is_active: boolean
}

type MomentsTableProps = {
  moments: MomentRow[]
  catalogItems: CatalogItem[]
  momentItems: MomentItemRow[]
}

export function MomentsTable({ moments, catalogItems, momentItems }: MomentsTableProps) {
  const router = useRouter()

  const handleDelete = async (momentId: number) => {
    const confirmed = window.confirm("Tem a certeza que pretende eliminar este momento?")
    if (!confirmed) return

    try {
      const response = await fetch(`/api/moments/${momentId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Failed to delete moment")
      router.refresh()
    } catch (error) {
      console.error(error)
    }
  }

  const countSuggestions = (momentId: number) =>
    momentItems.filter((item) => item.moment_id === momentId).length

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Momento</TableHead>
            <TableHead>Key</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Sugestoes</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Acoes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {moments.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Nenhum momento encontrado.
              </TableCell>
            </TableRow>
          ) : (
            moments.map((moment) => (
              <TableRow key={moment.id}>
                <TableCell className="font-medium">
                  <div>{moment.title_pt}</div>
                  <div className="text-xs text-muted-foreground">{moment.title_en}</div>
                </TableCell>
                <TableCell>{moment.key}</TableCell>
                <TableCell>{moment.sort_order}</TableCell>
                <TableCell>{countSuggestions(moment.id)}</TableCell>
                <TableCell>
                  <Badge variant={moment.is_active ? "default" : "secondary"}>
                    {moment.is_active ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <MomentEditDialog moment={moment} />
                    <MomentItemsDialog moment={moment} catalogItems={catalogItems} momentItems={momentItems} />
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(moment.id)}
                      className="text-white hover:text-white"
                    >
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
