"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/contexts/I18nContext"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2 } from "lucide-react"
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog"

interface Utilizador {
  id: string
  name?: string
  email: string
  role: string
  createdAt: string
}

export default function UtilizadoresPage() {
  const { t } = useI18n()
  const { data: session } = useSession()
  const [utilizadores, setUtilizadores] = useState<Utilizador[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Utilizador | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "EDITOR",
  })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Utilizador | null>(null)

  useEffect(() => {
    fetchUtilizadores()
  }, [])

  const fetchUtilizadores = async () => {
    try {
      const res = await fetch("/api/utilizadores")
      if (res.ok) {
        const data = await res.json()
        setUtilizadores(data)
      } else {
        toast({
          title: "Erro",
          description: "Acesso negado",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar utilizadores",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const url = editing
        ? `/api/utilizadores/${editing.id}`
        : "/api/utilizadores"
      const method = editing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast({
          title: t("common.success") || "Sucesso",
          description: editing
            ? t("users.updated") || "Utilizador atualizado com sucesso"
            : t("users.created") || "Utilizador criado com sucesso",
        })
        setOpen(false)
        setEditing(null)
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "EDITOR",
        })
        fetchUtilizadores()
      } else {
        const error = await res.json()
        toast({
          title: t("common.error") || "Erro",
          description: error.error || (t("users.saveError") || "Erro ao salvar utilizador"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error") || "Erro",
        description: t("users.saveError") || "Erro ao salvar utilizador",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (utilizador: Utilizador) => {
    setEditing(utilizador)
    setFormData({
      name: utilizador.name || "",
      email: utilizador.email,
      password: "",
      role: utilizador.role,
    })
    setOpen(true)
  }

  const handleDeleteClick = (utilizador: Utilizador) => {
    setDeleteTarget(utilizador)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return

    try {
      const res = await fetch(`/api/utilizadores/${deleteTarget.id}`, { method: "DELETE" })
      if (res.ok) {
        toast({
          title: t("common.success") || "Sucesso",
          description: t("users.deleted") || "Utilizador deletado com sucesso",
        })
        fetchUtilizadores()
      } else {
        const error = await res.json()
        toast({
          title: t("common.error") || "Erro",
          description: error.error || (t("users.deleteError") || "Erro ao deletar utilizador"),
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: t("common.error") || "Erro",
        description: t("users.deleteError") || "Erro ao deletar utilizador",
        variant: "destructive",
      })
    }
  }

  const getRoleLabel = (role: string) => {
    return role === "ADMIN" ? t("users.admin") : t("users.editor")
  }

  const user = session?.user as any

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-lg font-semibold dark:text-white mb-2">
            {t("common.accessDenied") || "Acesso negado"}
          </p>
          <p className="text-gray-600 dark:text-gray-400">
            {t("users.adminOnly") || "Apenas administradores podem acessar esta página."}
          </p>
        </div>
      </div>
    )
  }

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t("users.title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              variant="default"
              onClick={() => {
                setEditing(null)
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  role: "EDITOR",
                })
              }}
            >
              <Plus className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t("users.new")}</span>
              <span className="sm:hidden">{t("common.new")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editing ? t("users.edit") : t("users.new")}
                </DialogTitle>
                <DialogDescription>
                  {editing
                    ? t("form.updateInfo") + " " + t("users.title").toLowerCase()
                    : t("form.fillData") + " " + t("users.new").toLowerCase()}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">{t("users.name")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">{t("users.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password">
                    {editing ? t("users.newPassword") : t("users.password")}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    required={!editing}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">{t("users.role")}</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">{t("users.admin")}</SelectItem>
                      <SelectItem value="EDITOR">{t("users.editor")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit">{t("common.save")}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Mobile Cards View */}
      <div className="block sm:hidden space-y-4">
        {utilizadores.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
            {t("users.noUsers")}
          </div>
        ) : (
          utilizadores.map((utilizador) => (
            <div key={utilizador.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-lg dark:text-white">{utilizador.name || utilizador.email}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{utilizador.email}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>{t("users.role")}: {getRoleLabel(utilizador.role)}</span>
                  <span>
                    {t("users.creationDate")}: {new Date(utilizador.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(utilizador)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {t("common.edit")}
                </Button>
                {utilizador.id !== user?.id && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleDeleteClick(utilizador)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    {t("common.delete")}
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-700">
              <TableHead className="dark:text-gray-300">{t("users.name")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("users.email")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("users.role")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("users.creationDate")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {utilizadores.length === 0 ? (
              <TableRow className="dark:border-gray-700">
                <TableCell colSpan={5} className="text-center dark:text-gray-400">
                  {t("users.noUsers")}
                </TableCell>
              </TableRow>
            ) : (
              utilizadores.map((utilizador) => (
                <TableRow key={utilizador.id} className="dark:border-gray-700">
                  <TableCell className="dark:text-gray-300">{utilizador.name || "-"}</TableCell>
                  <TableCell className="dark:text-gray-300">{utilizador.email}</TableCell>
                  <TableCell className="dark:text-gray-300">{getRoleLabel(utilizador.role)}</TableCell>
                  <TableCell className="dark:text-gray-300">
                    {new Date(utilizador.createdAt).toLocaleDateString("pt-BR")}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(utilizador)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {utilizador.id !== user?.id && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => handleDeleteClick(utilizador)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel={t("users.title")}
        identifier={deleteTarget?.email || deleteTarget?.name || ""}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}

