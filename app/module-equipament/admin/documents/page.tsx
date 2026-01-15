"use client"

import { useEffect, useState, useCallback } from "react"
import { useI18n } from "@/contexts/I18nContext"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Edit, Search, Filter, X } from "lucide-react"
import Link from "next/link"

interface Documento {
  id: string
  titulo: string
  descricao?: string
  arquivo: string
  tipo: string
  dataVencimento?: string
  equipamentoId: string
  equipamento?: {
    tipo: string
    matricula?: string
    parque?: string
    modelo: string
  }
}

interface Equipamento {
  id: string
  tipo: string
  matricula?: string
  parque?: string
  modelo: string
}

export default function DocumentosPage() {
  const { t } = useI18n()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [filterEquipamento, setFilterEquipamento] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [groupByEquipamento, setGroupByEquipamento] = useState<boolean>(false)

  const fetchDocumentos = useCallback(async () => {
    try {
      const res = await fetch("/api/documentos")
      const data = await res.json()
      setDocumentos(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar documentos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchEquipamentos = useCallback(async () => {
    try {
      const res = await fetch("/api/equipamentos")
      if (!res.ok) {
        throw new Error("Erro ao buscar equipamentos")
      }
      const data = await res.json()

      setEquipamentos(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      setEquipamentos([]) 
    }
  }, [])

  useEffect(() => {
    fetchDocumentos()
    fetchEquipamentos()
  }, [fetchDocumentos, fetchEquipamentos])

  const filteredDocumentos = documentos.filter((doc) => {
    const matchesEquipamento = filterEquipamento === "all" || doc.equipamentoId === filterEquipamento
    const matchesSearch =
      searchTerm === "" ||
      doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.equipamento?.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (doc.equipamento?.parque?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      doc.equipamento?.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesEquipamento && matchesSearch
  })

  const groupedDocumentos = groupByEquipamento
    ? filteredDocumentos.reduce((acc, doc) => {
        const key = doc.equipamentoId || "sem-equipamento"
        if (!acc[key]) {
          acc[key] = {
            equipamento: doc.equipamento || { tipo: "VEICULO", matricula: "Sem equipamento", modelo: "" },
            documentos: [],
          }
        }
        acc[key].documentos.push(doc)
        return acc
      }, {} as Record<string, { equipamento: { tipo: string; matricula?: string; parque?: string; modelo: string }; documentos: Documento[] }>)
    : null

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t("documents.title")}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("pages.viewOnly").replace("{type}", t("pages.viewOnly.documents"))}
          </p>
        </div>
      </div>

      {}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t("common.search")}
            </Label>
            <div className="relative">
              <Input
                id="search"
                placeholder={t("pages.search.placeholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-equipamento" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("common.filter")} {t("events.vehicle")}
            </Label>
            <Select value={filterEquipamento} onValueChange={setFilterEquipamento}>
              <SelectTrigger id="filter-equipamento">
                <SelectValue placeholder={t("form.allVehicles")} />
              </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">{t("form.allVehicles")}</SelectItem>
                {Array.isArray(equipamentos) && equipamentos.map((equipamento) => (
                  <SelectItem key={equipamento.id} value={equipamento.id}>
                    {equipamento.tipo === "VEICULO" 
                      ? (equipamento.matricula || "N/A")
                      : (equipamento.parque || "N/A")} - {equipamento.modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {t("form.showing")} {filteredDocumentos.length} {t("form.of")} {documentos.length} {t("form.document")}
          </div>
          <Button
            variant={groupByEquipamento ? "default" : "outline"}
            size="sm"
            onClick={() => setGroupByEquipamento(!groupByEquipamento)}
          >
            {groupByEquipamento ? t("events.normalView") : t("events.groupByVehicle")}
          </Button>
        </div>
      </div>

      {}
      <div className="block sm:hidden space-y-4">
        {filteredDocumentos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
            {documentos.length === 0
              ? t("documents.noDocuments")
              : t("common.noResults")}
          </div>
        ) : groupByEquipamento && groupedDocumentos ? (
          Object.entries(groupedDocumentos).map(([equipamentoId, group]) => (
            <div key={equipamentoId} className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded">
                <h3 className="font-bold text-lg dark:text-white">
                  {group.equipamento.tipo === "VEICULO" 
                    ? (group.equipamento.matricula || "N/A")
                    : (group.equipamento.parque || "N/A")} - {group.equipamento.modelo}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {group.documentos.length} documento(s)
                </p>
              </div>
              {group.documentos.map((documento) => (
                <div key={documento.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 ml-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg dark:text-white">{documento.titulo}</h3>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>{t("documents.type")}: {documento.tipo}</span>
                      {documento.dataVencimento && (
                        <span>
                          Venc: {new Date(documento.dataVencimento).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/module-equipament/admin/equipment/${documento.equipamentoId}?tab=documents`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        {t("pages.editInEquipment")}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          filteredDocumentos.map((documento) => (
            <div key={documento.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="mb-3">
                <h3 className="font-semibold text-lg dark:text-white">{documento.titulo}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {documento.equipamento
                    ? `${documento.equipamento.tipo === "VEICULO" 
                        ? (documento.equipamento.matricula || "N/A")
                        : (documento.equipamento.parque || "N/A")} - ${documento.equipamento.modelo}`
                    : "-"}
                </p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Tipo: {documento.tipo}</span>
                  {documento.dataVencimento && (
                    <span>
                      Venc: {new Date(documento.dataVencimento).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/module-equipament/admin/equipment/${documento.equipamentoId}?tab=documents`} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar no Equipamento
                  </Button>
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {}
      <div className="hidden sm:block space-y-4">
        {groupByEquipamento && groupedDocumentos ? (
          Object.entries(groupedDocumentos).map(([equipamentoId, group]) => (
            <div key={equipamentoId} className="bg-white rounded-lg shadow overflow-x-auto">
              <div className="bg-blue-50 border-b p-3">
                <h3 className="font-bold text-lg">
                  {group.equipamento.tipo === "VEICULO" 
                    ? (group.equipamento.matricula || "N/A")
                    : (group.equipamento.parque || "N/A")} - {group.equipamento.modelo}
                </h3>
                <p className="text-sm text-gray-600">
                  {group.documentos.length} documento(s)
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="dark:border-gray-700">
                    <TableHead className="dark:text-gray-300">{t("documents.titleField")}</TableHead>
                    <TableHead className="dark:text-gray-300">{t("documents.type")}</TableHead>
                    <TableHead className="dark:text-gray-300">{t("documents.expiration")}</TableHead>
                    <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.documentos.map((documento) => (
                    <TableRow key={documento.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">{documento.titulo}</TableCell>
                      <TableCell className="dark:text-gray-300">{documento.tipo}</TableCell>
                      <TableCell className="dark:text-gray-300">
                        {documento.dataVencimento
                          ? new Date(documento.dataVencimento).toLocaleDateString("pt-BR")
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/module-equipament/admin/equipment/${documento.equipamentoId}?tab=documents`}>
                            <Button
                              variant="outline"
                              size="icon"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="dark:border-gray-700">
                  <TableHead className="dark:text-gray-300">{t("documents.titleField")}</TableHead>
                  <TableHead className="dark:text-gray-300">{t("events.vehicle")}</TableHead>
                  <TableHead className="dark:text-gray-300">{t("documents.type")}</TableHead>
                  <TableHead className="dark:text-gray-300">{t("documents.expiration")}</TableHead>
                  <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocumentos.length === 0 ? (
                  <TableRow className="dark:border-gray-700">
                    <TableCell colSpan={5} className="text-center dark:text-gray-400">
                      {documentos.length === 0
                        ? t("documents.noDocuments")
                        : t("common.noResults")}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDocumentos.map((documento) => (
                    <TableRow key={documento.id} className="dark:border-gray-700">
                      <TableCell className="dark:text-gray-300">{documento.titulo}</TableCell>
                      <TableCell className="dark:text-gray-300">
                        {documento.equipamento
                          ? `${documento.equipamento.tipo === "VEICULO" 
                              ? (documento.equipamento.matricula || "N/A")
                              : (documento.equipamento.parque || "N/A")} - ${documento.equipamento.modelo}`
                          : "-"}
                      </TableCell>
                      <TableCell className="dark:text-gray-300">{documento.tipo}</TableCell>
                      <TableCell className="dark:text-gray-300">
                        {documento.dataVencimento
                          ? new Date(documento.dataVencimento).toLocaleDateString(
                              "pt-BR"
                            )
                          : "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Link href={`/module-equipament/admin/equipment/${documento.equipamentoId}?tab=documents`}>
                            <Button
                              variant="outline"
                              size="icon"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

    </div>
  )
}

