"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Pencil, PlusCircle } from "lucide-react"

export type TermsTemplateRow = {
  id: string
  name: string
  content_pt: string
  content_en: string
  is_default: boolean | null
}

const emptyForm = {
  name: "",
  content_pt: "",
  content_en: "",
}

export function TermsTemplatesSection({ templates }: { templates: TermsTemplateRow[] }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const editingTemplate = editingId ? templates.find((t) => t.id === editingId) : null

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setError(null)
    setOpen(true)
  }

  const openEdit = (t: TermsTemplateRow) => {
    setEditingId(t.id)
    setForm({
      name: t.name,
      content_pt: t.content_pt ?? "",
      content_en: t.content_en ?? "",
    })
    setError(null)
    setOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError("Nome do modelo é obrigatório.")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url = editingId ? `/api/terms-templates/${editingId}` : "/api/terms-templates"
      const method = editingId ? "PATCH" : "POST"
      const body = editingId
        ? { name: form.name.trim(), content_pt: form.content_pt, content_en: form.content_en }
        : { name: form.name.trim(), content_pt: form.content_pt, content_en: form.content_en }
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      })
      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(typeof err?.error === "string" ? err.error : "Falha ao guardar.")
      }
      setOpen(false)
      setForm(emptyForm)
      setEditingId(null)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao guardar.")
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Eliminar este modelo de condições gerais?")) return
    try {
      const response = await fetch(`/api/terms-templates/${id}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Falha ao eliminar.")
      router.refresh()
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Falha ao eliminar.")
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Modelos de condições gerais</CardTitle>
          <CardDescription>
            Crie modelos com versão em português e em inglês. O texto em inglês é usado quando o PDF é gerado em English.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) setError(null) }}>
              <Button onClick={() => { openCreate(); setOpen(true) }}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo modelo
              </Button>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? "Editar modelo" : "Novo modelo"}</DialogTitle>
                  <DialogDescription>
                    Preencha o conteúdo em português e em inglês. Ambos são obrigatórios para o PDF em ambos os idiomas.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="terms_name">Nome do modelo</Label>
                    <Input
                      id="terms_name"
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="ex: Condições Gerais (Padrão)"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="terms_pt">Conteúdo (Português)</Label>
                    <Textarea
                      id="terms_pt"
                      value={form.content_pt}
                      onChange={(e) => setForm((p) => ({ ...p, content_pt: e.target.value }))}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="terms_en">Conteúdo (English)</Label>
                    <Textarea
                      id="terms_en"
                      value={form.content_en}
                      onChange={(e) => setForm((p) => ({ ...p, content_en: e.target.value }))}
                      rows={8}
                      className="font-mono text-sm"
                    />
                  </div>
                  {error ? <p className="text-sm text-destructive">{error}</p> : null}
                  <DialogFooter>
                    <Button type="submit" disabled={loading}>
                      {loading ? "A guardar..." : editingId ? "Guardar" : "Criar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center text-muted-foreground">
                      Nenhum modelo. Crie um para usar na secção Conteúdo da nova proposta.
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-medium">{t.name}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => { openEdit(t); setOpen(true) }}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(t.id)}
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
        </CardContent>
      </Card>
    </>
  )
}
