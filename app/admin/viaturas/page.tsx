"use client"

import { useEffect, useState } from "react"
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
import { Plus, Edit, Trash2, QrCode, Download, Search, Filter, X } from "lucide-react"
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

interface Viatura {
  id: string
  matricula: string
  modelo: string
  marca: string
  ano: number
  foto?: string
  descricao?: string
  qrCode?: string
}

export default function ViaturasPage() {
  const [viaturas, setViaturas] = useState<Viatura[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Viatura | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    matricula: "",
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
  const [deleteTarget, setDeleteTarget] = useState<Viatura | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterMarca, setFilterMarca] = useState<string>("all")
  const [filterModelo, setFilterModelo] = useState<string>("all")
  const [filterAno, setFilterAno] = useState<string>("all")

  useEffect(() => {
    fetchViaturas()
  }, [])

  const fetchViaturas = async () => {
    try {
      const res = await fetch("/api/viaturas")
      const data = await res.json()
      setViaturas(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar viaturas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho (3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Tamanho máximo: 3MB",
          variant: "destructive",
        })
        return
      }
      // Validar tipo
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Erro",
          description: "Apenas imagens são permitidas",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
      // Criar preview
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

      // Se houver arquivo selecionado, fazer upload primeiro
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

      const url = editing ? `/api/viaturas/${editing.id}` : "/api/viaturas"
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
            ? "Viatura atualizada com sucesso"
            : "Viatura criada com sucesso",
        })
        setOpen(false)
        setEditing(null)
        setFormData({
          matricula: "",
          modelo: "",
          marca: "",
          ano: "",
          foto: "",
          descricao: "",
        })
        setSelectedFile(null)
        setPreview("")
        fetchViaturas()
      } else {
        const error = await res.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao salvar viatura",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar viatura",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (viatura: Viatura) => {
    setEditing(viatura)
    setFormData({
      matricula: viatura.matricula,
      modelo: viatura.modelo,
      marca: viatura.marca,
      ano: viatura.ano.toString(),
      foto: viatura.foto || "",
      descricao: viatura.descricao || "",
    })
    setSelectedFile(null)
    setPreview(viatura.foto || "")
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/viaturas/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Viatura deletada com sucesso",
        })
        fetchViaturas()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao deletar viatura",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar viatura",
        variant: "destructive",
      })
    }
  }

  const handleDownloadQRCodePDF = async (viatura: Viatura) => {
    if (!viatura.qrCode) {
      toast({
        title: "Erro",
        description: "QR Code não disponível para esta viatura",
        variant: "destructive",
      })
      return
    }

    try {
      // Criar novo documento PDF (A4: 210x297mm)
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Configurações
      const pageWidth = 210
      const pageHeight = 297
      const margin = 20
      const qrSize = 80 // Tamanho do QR code em mm
      const qrX = (pageWidth - qrSize) / 2 // Centralizar horizontalmente
      const qrY = margin + 30

      // Título
      pdf.setFontSize(20)
      pdf.setFont("helvetica", "bold")
      pdf.text("QR Code da Viatura", pageWidth / 2, margin + 15, {
        align: "center",
      })

      // Adicionar QR Code
      pdf.addImage(viatura.qrCode, "PNG", qrX, qrY, qrSize, qrSize)

      // Informações da viatura
      const infoY = qrY + qrSize + 20
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("Informações da Viatura", pageWidth / 2, infoY, {
        align: "center",
      })

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      pdf.text(`Matrícula: ${viatura.matricula}`, pageWidth / 2, infoY + 10, {
        align: "center",
      })
      pdf.text(
        `Marca: ${viatura.marca}`,
        pageWidth / 2,
        infoY + 16,
        { align: "center" }
      )
      pdf.text(
        `Modelo: ${viatura.modelo}`,
        pageWidth / 2,
        infoY + 22,
        { align: "center" }
      )
      pdf.text(`Ano: ${viatura.ano}`, pageWidth / 2, infoY + 28, {
        align: "center",
      })

      // Instruções
      const instructionsY = infoY + 40
      pdf.setFontSize(10)
      pdf.setFont("helvetica", "italic")
      pdf.text(
        "Escaneie o QR Code para acessar as informações da viatura",
        pageWidth / 2,
        instructionsY,
        { align: "center" }
      )

      // Rodapé
      pdf.setFontSize(8)
      pdf.setFont("helvetica", "normal")
      pdf.text(
        `Gerado em ${new Date().toLocaleDateString("pt-PT")}`,
        pageWidth / 2,
        pageHeight - margin,
        { align: "center" }
      )

      // Salvar PDF
      pdf.save(`QRCode-${viatura.matricula}.pdf`)

      toast({
        title: "Sucesso",
        description: "QR Code baixado em PDF com sucesso",
      })
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do QR Code",
        variant: "destructive",
      })
    }
  }

  // Filtrar viaturas
  const filteredViaturas = viaturas.filter((viatura) => {
    const matchesSearch =
      searchTerm === "" ||
      viatura.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viatura.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viatura.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viatura.ano.toString().includes(searchTerm)
    
    const matchesMarca = filterMarca === "all" || viatura.marca === filterMarca
    const matchesModelo = filterModelo === "all" || viatura.modelo === filterModelo
    const matchesAno = filterAno === "all" || viatura.ano.toString() === filterAno
    
    return matchesSearch && matchesMarca && matchesModelo && matchesAno
  })

  // Obter valores únicos para filtros
  const marcas = Array.from(new Set(viaturas.map((v) => v.marca))).sort()
  const modelos = Array.from(new Set(viaturas.map((v) => v.modelo))).sort()
  const anos = Array.from(new Set(viaturas.map((v) => v.ano))).sort((a, b) => b - a)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("vehicles.title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditing(null)
                setFormData({
                  matricula: "",
                  modelo: "",
                  marca: "",
                  ano: "",
                  foto: "",
                  descricao: "",
                })
                setSelectedFile(null)
                setPreview("")
              }}
            >
              <Plus className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t("vehicles.new")}</span>
              <span className="sm:hidden">{t("common.new")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editing ? t("vehicles.edit") : t("vehicles.new")}
                </DialogTitle>
                <DialogDescription>
                  {editing
                    ? t("form.updateInfo") + " " + t("vehicles.title").toLowerCase()
                    : t("form.fillData") + " " + t("vehicles.new").toLowerCase()}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="matricula">{t("vehicles.license")}</Label>
                  <Input
                    id="matricula"
                    value={formData.matricula}
                    onChange={(e) =>
                      setFormData({ ...formData, matricula: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="marca">{t("vehicles.brand")}</Label>
                  <Input
                    id="marca"
                    value={formData.marca}
                    onChange={(e) =>
                      setFormData({ ...formData, marca: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="modelo">{t("vehicles.model")}</Label>
                  <Input
                    id="modelo"
                    value={formData.modelo}
                    onChange={(e) =>
                      setFormData({ ...formData, modelo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ano">{t("vehicles.year")}</Label>
                  <Input
                    id="ano"
                    type="number"
                    value={formData.ano}
                    onChange={(e) =>
                      setFormData({ ...formData, ano: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="foto">{t("vehicles.photo")}</Label>
                  <Input
                    id="foto"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t("form.maxSize")}: 3MB. {t("form.formats")}: JPG, PNG, WEBP
                  </p>
                  {preview && (
                    <div className="mt-2">
                      <img
                        src={preview}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded border"
                      />
                    </div>
                  )}
                  {formData.foto && !preview && (
                    <div className="mt-2">
                      <img
                        src={formData.foto}
                        alt="Foto atual"
                        className="w-full h-48 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descricao">{t("vehicles.description")}</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setOpen(false)
                    setSelectedFile(null)
                    setPreview("")
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? t("form.uploading") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              {t("common.search")}
            </Label>
            <div className="relative">
              <Input
                id="search"
                placeholder={t("vehicles.license") + ", " + t("vehicles.brand") + ", " + t("vehicles.model") + "..."}
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
            <Label htmlFor="filter-marca" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("vehicles.filterByBrand")}
            </Label>
            <Select value={filterMarca} onValueChange={setFilterMarca}>
              <SelectTrigger id="filter-marca">
                <SelectValue placeholder={t("vehicles.allBrands")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("vehicles.allBrands")}</SelectItem>
                {marcas.map((marca) => (
                  <SelectItem key={marca} value={marca}>
                    {marca}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-modelo" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("vehicles.filterByModel")}
            </Label>
            <Select value={filterModelo} onValueChange={setFilterModelo}>
              <SelectTrigger id="filter-modelo">
                <SelectValue placeholder={t("vehicles.allModels")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("vehicles.allModels")}</SelectItem>
                {modelos.map((modelo) => (
                  <SelectItem key={modelo} value={modelo}>
                    {modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-ano" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("vehicles.filterByYear")}
            </Label>
            <Select value={filterAno} onValueChange={setFilterAno}>
              <SelectTrigger id="filter-ano">
                <SelectValue placeholder={t("vehicles.allYears")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("vehicles.allYears")}</SelectItem>
                {anos.map((ano) => (
                  <SelectItem key={ano} value={ano.toString()}>
                    {ano}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {t("common.view")}: {filteredViaturas.length} {t("vehicles.title").toLowerCase()} de {viaturas.length}
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block sm:hidden space-y-4">
        {filteredViaturas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
            {viaturas.length === 0 ? t("vehicles.noVehicles") : "Nenhuma viatura encontrada com os filtros aplicados"}
          </div>
        ) : (
          filteredViaturas.map((viatura) => (
            <div key={viatura.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg dark:text-white">{viatura.matricula}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{viatura.marca} {viatura.modelo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ano: {viatura.ano}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(viatura)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  {t("common.edit")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => {
                    setDeleteTarget(viatura)
                    setDeleteDialogOpen(true)
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  {t("common.delete")}
                </Button>
                {viatura.qrCode && (
                  <>
                    <Link href={`/viatura/${viatura.matricula}`} target="_blank" className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <QrCode className="h-4 w-4 mr-1" />
                        QR
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadQRCodePDF(viatura)}
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

      {/* Desktop Table View */}
      <div className="hidden sm:block bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="dark:border-gray-700">
              <TableHead className="dark:text-gray-300">{t("vehicles.license")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.brand")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.model")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.year")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredViaturas.length === 0 ? (
              <TableRow className="dark:border-gray-700">
                <TableCell colSpan={5} className="text-center dark:text-gray-400">
                  {viaturas.length === 0 ? t("vehicles.noVehicles") : "Nenhuma viatura encontrada com os filtros aplicados"}
                </TableCell>
              </TableRow>
            ) : (
              filteredViaturas.map((viatura) => (
                <TableRow key={viatura.id} className="dark:border-gray-700">
                  <TableCell className="dark:text-gray-300">{viatura.matricula}</TableCell>
                  <TableCell className="dark:text-gray-300">{viatura.marca}</TableCell>
                  <TableCell className="dark:text-gray-300">{viatura.modelo}</TableCell>
                  <TableCell className="dark:text-gray-300">{viatura.ano}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleEdit(viatura)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setDeleteTarget(viatura)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {viatura.qrCode && (
                        <>
                          <Link href={`/viatura/${viatura.matricula}`} target="_blank">
                            <Button variant="outline" size="icon" title="Ver QR Code">
                              <QrCode className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDownloadQRCodePDF(viatura)}
                            title="Baixar QR Code em PDF"
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
        identifier={deleteTarget ? deleteTarget.matricula : ""}
        onConfirm={async () => {
          if (!deleteTarget) return
          await handleDelete(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}

