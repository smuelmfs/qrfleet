"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
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
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, QrCode, Download, Search, Filter, X, Car, Wrench, Image as ImageIcon } from "lucide-react"
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog"
import jsPDF from "jspdf"
import { useI18n } from "@/contexts/I18nContext"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Equipamento {
  id: string
  tipo: string
  matricula?: string
  parque?: string
  peso?: string
  modelo: string
  marca: string
  ano: number
  foto?: string
  descricao?: string
  qrCode?: string
  _count?: {
    documentos: number
    eventos: number
  }
}

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Equipamento | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    tipo: "VEICULO",
    matricula: "",
    parque: "",
    modelo: "",
    marca: "",
    ano: "",
    foto: "",
    descricao: "",
  })
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const { t } = useI18n()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Equipamento | null>(null)

  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterTipo, setFilterTipo] = useState<string>("all")
  const [filterMarca, setFilterMarca] = useState<string>("all")
  const [filterModelo, setFilterModelo] = useState<string>("all")
  const [filterAno, setFilterAno] = useState<string>("all")

  const fetchEquipamentos = useCallback(async () => {
    try {
      const res = await fetch("/api/equipamentos")
      if (!res.ok) {
        throw new Error("Erro ao buscar equipamentos")
      }
      const data = await res.json()


      if (data.error) {
        console.error("Erro da API:", data.error)
        setEquipamentos([])
        return
      }
      const equipamentosArray = Array.isArray(data) ? data : []
      console.log("Equipamentos carregados:", equipamentosArray.length, equipamentosArray)
      setEquipamentos(equipamentosArray)
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      toast({
        title: t("common.error"),
        description: t("vehicles.noVehicles"),
        variant: "destructive",
      })
        setEquipamentos([]) 
    } finally {
      setLoading(false)
    }
  }, [toast, t])

  useEffect(() => {
    fetchEquipamentos()
  }, [fetchEquipamentos])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {

      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Tamanho máximo: 3MB",
          variant: "destructive",
        })
        return
      }

      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erro",
          description: "Apenas imagens são permitidas",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)

      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let fotoUrl = formData.foto

      if (selectedFile) {
        setUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", selectedFile)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadRes.ok) {
          const error = await uploadRes.json()
          toast({
            title: "Erro",
            description: error.error || "Erro ao fazer upload da imagem",
            variant: "destructive",
          })
          setUploading(false)
          return
        }

        const { url } = await uploadRes.json()
        fotoUrl = url
        setUploading(false)
      }

      const url = editing ? `/api/equipamentos/${editing.id}` : "/api/equipamentos"
      const method = editing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, foto: fotoUrl }),
      })

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: editing
            ? "Equipamento atualizado com sucesso"
            : "Equipamento criado com sucesso",
        })
        setOpen(false)
        setEditing(null)
        setFormData({
          tipo: "VEICULO",
          matricula: "",
          parque: "",
          modelo: "",
          marca: "",
          ano: "",
          foto: "",
          descricao: "",
        })
        setSelectedFile(null)
        setPreview("")
        fetchEquipamentos()
      } else {
        const error = await res.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao salvar equipamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar equipamento",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (equipamento: Equipamento) => {

    window.location.href = `/module-equipament/admin/equipment/${equipamento.id}`
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/equipamentos/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Equipamento deletado com sucesso",
        })
        fetchEquipamentos()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao deletar equipamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar equipamento",
        variant: "destructive",
      })
    }
  }

  const handleDownloadQRCodePDF = async (equipamento: Equipamento) => {
    if (!equipamento.qrCode) {
      toast({
        title: t("common.error"),
        description: t("equipment.list.qrNotAvailable"),
        variant: "destructive",
      })
      return
    }

    try {

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      const pageWidth = 210
      const pageHeight = 297
      const margin = 20
      const qrSize = 80 
      const qrX = (pageWidth - qrSize) / 2 
      const qrY = margin + 30

      pdf.setFontSize(20)
      pdf.setFont("helvetica", "bold")
      pdf.text(t("pdf.qrCode.title"), pageWidth / 2, margin + 15, {
        align: "center",
      })

      pdf.addImage(equipamento.qrCode, "PNG", qrX, qrY, qrSize, qrSize)

      const infoY = qrY + qrSize + 20
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text(t("pdf.qrCode.equipmentInfo"), pageWidth / 2, infoY, {
        align: "center",
      })

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      const identificador = equipamento.tipo === "VEICULO" 
        ? `${t("pdf.qrCode.license")}: ${equipamento.matricula}`
        : `${t("pdf.qrCode.park")}: ${equipamento.parque}`
      pdf.text(identificador, pageWidth / 2, infoY + 10, {
        align: "center",
      })
      pdf.text(
        `${t("pdf.qrCode.brand")}: ${equipamento.marca}`,
        pageWidth / 2,
        infoY + 16,
        { align: "center" }
      )
      pdf.text(
        `${t("pdf.qrCode.model")}: ${equipamento.modelo}`,
        pageWidth / 2,
        infoY + 22,
        { align: "center" }
      )
      pdf.text(`${t("pdf.qrCode.year")}: ${equipamento.ano}`, pageWidth / 2, infoY + 28, {
        align: "center",
      })

      const instructionsY = infoY + 40
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "italic")
      pdf.text(
        t("pdf.qrCode.instructions"),
        pageWidth / 2,
        instructionsY,
        { align: "center" }
      )

      pdf.setFontSize(8)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `${t("pdf.qrCode.generated")} ${new Date().toLocaleDateString("pt-PT")}`,
        pageWidth / 2,
        pageHeight - margin,
        { align: "center" }
      )

      const nomeArquivo = equipamento.tipo === "VEICULO" 
        ? equipamento.matricula 
        : equipamento.parque
      pdf.save(`QRCode-${nomeArquivo}.pdf`)

      toast({
        title: t("common.success"),
        description: t("pdf.qrCode.success"),
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: t("common.error"),
        description: t("pdf.qrCode.error"),
        variant: "destructive",
      })
    }
  }

  console.log("Equipamentos antes do filter:", equipamentos, "É array?", Array.isArray(equipamentos))
  const filteredEquipamentos = Array.isArray(equipamentos) ? equipamentos.filter((equipamento) => {
    const identificador = equipamento.tipo === "VEICULO" ? equipamento.matricula : equipamento.parque
    const matchesSearch =
      searchTerm === "" ||
      identificador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipamento.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipamento.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      equipamento.ano.toString().includes(searchTerm) ||
      (equipamento.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesTipo = filterTipo === "all" || equipamento.tipo === filterTipo
    const matchesMarca = filterMarca === "all" || equipamento.marca === filterMarca
    const matchesModelo = filterModelo === "all" || equipamento.modelo === filterModelo
    const matchesAno = filterAno === "all" || equipamento.ano.toString() === filterAno
    
    return matchesSearch && matchesTipo && matchesMarca && matchesModelo && matchesAno
  }) : []
  
  console.log("Filtros ativos:", { filterTipo, filterMarca, filterModelo, filterAno, searchTerm })
  console.log("Equipamentos filtrados:", filteredEquipamentos.length)

  const hasActiveFilters = filterTipo !== "all" || filterMarca !== "all" || filterModelo !== "all" || filterAno !== "all" || searchTerm !== ""

  const clearAllFilters = () => {
    setSearchTerm("")
    setFilterTipo("all")
    setFilterMarca("all")
    setFilterModelo("all")
    setFilterAno("all")
  }

  const marcas = Array.isArray(equipamentos) ? Array.from(new Set(equipamentos.map((e) => e.marca))).sort() : []
  const modelos = Array.isArray(equipamentos) ? Array.from(new Set(equipamentos.map((e) => e.modelo))).sort() : []
  const anos = Array.isArray(equipamentos) ? Array.from(new Set(equipamentos.map((e) => e.ano))).sort((a, b) => b - a) : []

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("vehicles.title")}</h1>
        <Link href="/module-equipament/admin/equipment/new">
          <Button>
            <Plus className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">{t("equipment.list.new")}</span>
            <span className="sm:hidden">{t("equipment.list.newShort")}</span>
          </Button>
        </Link>
      </div>

      {}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {t("equipment.list.filters")}
          </h2>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-8"
            >
              <X className="h-3 w-3 mr-1" />
              {t("equipment.list.clearFilters")}
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <div className="relative">
              <Input
                id="search"
                placeholder={t("equipment.list.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-9 h-9"
              />
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
          
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger id="filter-tipo" className="h-9">
              <SelectValue placeholder={t("equipment.list.type")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("equipment.list.allTypes")}</SelectItem>
              <SelectItem value="VEICULO">{t("equipment.type.vehicle")}</SelectItem>
              <SelectItem value="MAQUINA">{t("equipment.type.machine")}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterMarca} onValueChange={setFilterMarca}>
            <SelectTrigger id="filter-marca" className="h-9">
              <SelectValue placeholder={t("equipment.list.brand")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("equipment.list.allBrands")}</SelectItem>
              {marcas.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterModelo} onValueChange={setFilterModelo}>
            <SelectTrigger id="filter-modelo" className="h-9">
              <SelectValue placeholder={t("equipment.list.model")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("equipment.list.allModels")}</SelectItem>
              {modelos.map((modelo) => (
                <SelectItem key={modelo} value={modelo}>
                  {modelo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterAno} onValueChange={setFilterAno}>
            <SelectTrigger id="filter-ano" className="h-9">
              <SelectValue placeholder={t("equipment.list.year")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("equipment.list.allYears")}</SelectItem>
              {anos.map((ano) => (
                <SelectItem key={ano} value={ano.toString()}>
                  {ano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mt-3 pt-3 border-t dark:border-gray-700">
          <div className="text-xs text-gray-600 dark:text-gray-400">
            <span className="font-semibold">{filteredEquipamentos.length}</span> {t("form.of")} <span className="font-semibold">{Array.isArray(equipamentos) ? equipamentos.length : 0}</span> {t("equipment.list.count")}
            {hasActiveFilters && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                {t("equipment.list.activeFilters")}
              </span>
            )}
          </div>
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-1.5">
              {filterTipo !== "all" && (
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                  Tipo: {filterTipo === "VEICULO" ? "Veículo" : "Máquina"}
                </span>
              )}
              {filterMarca !== "all" && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                  {filterMarca}
                </span>
              )}
              {filterModelo !== "all" && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                  {filterModelo}
                </span>
              )}
              {filterAno !== "all" && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                  {filterAno}
                </span>
              )}
              {searchTerm && (
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-xs">
                  &quot;{searchTerm}&quot;
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {}
  <div className="block sm:hidden space-y-4">
        {filteredEquipamentos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
            {Array.isArray(equipamentos) && equipamentos.length === 0 ? t("vehicles.noVehicles") : t("common.noResults")}
          </div>
        ) : (
          filteredEquipamentos.map((equipamento) => (
            <div key={equipamento.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex gap-4 mb-3">
                {equipamento.foto ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <img
                      src={equipamento.foto}
                      alt={equipamento.tipo === "VEICULO" ? equipamento.matricula : equipamento.parque}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600 flex-shrink-0">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {equipamento.tipo === "VEICULO" ? (
                      <Car className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Wrench className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      equipamento.tipo === "VEICULO"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    }`}>
                      {equipamento.tipo === "VEICULO" ? t("equipment.type.vehicle") : t("equipment.type.machine")}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg dark:text-white truncate">
                    {equipamento.tipo === "VEICULO" ? equipamento.matricula : equipamento.parque}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{equipamento.marca} {equipamento.modelo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t("equipment.list.year")}: {equipamento.ano}</p>
                  {equipamento.tipo === "VEICULO" ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("equipment.details.license")}</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t("equipment.details.park")}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/module-equipament/admin/equipment/${equipamento.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    {t("equipment.list.view")}/{t("equipment.list.edit")}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setDeleteTarget(equipamento)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t("common.delete")}
                </Button>
                      {equipamento.qrCode && (equipamento.matricula || equipamento.parque) && (
                        <>
                          <Link href={`/equipament-view/${equipamento.tipo === "VEICULO" ? equipamento.matricula : equipamento.parque}`} target="_blank" className="flex-1">
                            <Button variant="outline" size="sm" className="w-full">
                              <QrCode className="h-4 w-4 mr-1" />
                              QR
                            </Button>
                          </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadQRCodePDF(equipamento)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      PDF
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {}
      <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-700">
              <TableHead className="dark:text-gray-300">{t("equipment.list.type")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.photo")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("equipment.list.identification")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.brand")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.model")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.year")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEquipamentos.length === 0 ? (
              <TableRow className="dark:border-gray-700">
                <TableCell colSpan={7} className="text-center dark:text-gray-400">
                  {Array.isArray(equipamentos) && equipamentos.length === 0 ? t("vehicles.noVehicles") : t("common.noResults")}
                </TableCell>
              </TableRow>
            ) : (
              filteredEquipamentos.map((equipamento) => (
                <TableRow key={equipamento.id} className="dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {equipamento.tipo === "VEICULO" ? (
                        <Car className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Wrench className="h-4 w-4 text-orange-600" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        equipamento.tipo === "VEICULO"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      }`}>
                        {equipamento.tipo === "VEICULO" ? t("equipment.type.vehicle") : t("equipment.type.machine")}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {equipamento.foto ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img
                          src={equipamento.foto}
                          alt={equipamento.tipo === "VEICULO" ? equipamento.matricula : equipamento.parque}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center border border-gray-200 dark:border-gray-600">
                        <ImageIcon className="h-5 w-5 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="dark:text-gray-300">
                    <div>
                      <div className="font-semibold">
                        {equipamento.tipo === "VEICULO" ? equipamento.matricula : equipamento.parque}
                      </div>
                      {equipamento.tipo === "VEICULO" ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t("equipment.details.license")}</div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">{t("equipment.details.park")}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="dark:text-gray-300 font-medium">{equipamento.marca}</TableCell>
                  <TableCell className="dark:text-gray-300">{equipamento.modelo}</TableCell>
                  <TableCell className="dark:text-gray-300">{equipamento.ano}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/module-equipament/admin/equipment/${equipamento.id}`}>
                        <Button
                          variant="outline"
                          size="icon"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setDeleteTarget(equipamento)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {equipamento.qrCode && (equipamento.matricula || equipamento.parque) && (
                        <>
                          <Link href={`/equipament-view/${equipamento.tipo === "VEICULO" ? equipamento.matricula : equipamento.parque}`} target="_blank">
                            <Button variant="outline" size="icon" title={t("equipment.list.view") + " QR Code"}>
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDownloadQRCodePDF(equipamento)}
                            title={t("equipment.list.downloadQR")}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </>
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
        entityLabel={t("vehicles.title")}
        identifier={deleteTarget ? (deleteTarget.tipo === "VEICULO" ? deleteTarget.matricula || "" : deleteTarget.parque || "") : ""}
        onConfirm={async () => {
          if (!deleteTarget) return
          await handleDelete(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}

