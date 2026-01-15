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

interface Viatura {
  id: string
  tipo: string
  matricula?: string
  parque?: string
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

export default function ViaturasPage() {
  const [viaturas, setViaturas] = useState<Viatura[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Viatura | null>(null)
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
  const [deleteTarget, setDeleteTarget] = useState<Viatura | null>(null)
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [filterTipo, setFilterTipo] = useState<string>("all")
  const [filterMarca, setFilterMarca] = useState<string>("all")
  const [filterModelo, setFilterModelo] = useState<string>("all")
  const [filterAno, setFilterAno] = useState<string>("all")

  const fetchViaturas = useCallback(async () => {
    try {
      const res = await fetch("/api/viaturas")
      const data = await res.json()
      setViaturas(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar equipamentos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchViaturas()
  }, [fetchViaturas])

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
    // Redirecionar para página de detalhes ao invés de editar inline
    window.location.href = `/module-equipament/admin/equipment/${viatura.id}`
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/viaturas/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Equipamento deletado com sucesso",
        })
        fetchViaturas()
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

  const handleDownloadQRCodePDF = async (viatura: Viatura) => {
    if (!viatura.qrCode) {
      toast({
        title: "Erro",
        description: "QR Code não disponível para este equipamento",
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
      pdf.text("QR Code do Equipamento", pageWidth / 2, margin + 15, {
        align: "center",
      })

      // Adicionar QR Code
      pdf.addImage(viatura.qrCode, "PNG", qrX, qrY, qrSize, qrSize)

      // Informações do equipamento
      const infoY = qrY + qrSize + 20
      pdf.setFontSize(14)
      pdf.setFont("helvetica", "bold")
      pdf.text("Informações do Equipamento", pageWidth / 2, infoY, {
        align: "center",
      })

      pdf.setFontSize(12)
      pdf.setFont("helvetica", "normal")
      const identificador = viatura.tipo === "VEICULO" 
        ? `Matrícula: ${viatura.matricula}`
        : `Parque: ${viatura.parque}`
      pdf.text(identificador, pageWidth / 2, infoY + 10, {
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
        "Escaneie o QR Code para acessar as informações do equipamento",
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
      const nomeArquivo = viatura.tipo === "VEICULO" 
        ? viatura.matricula 
        : viatura.parque
      pdf.save(`QRCode-${nomeArquivo}.pdf`)

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
    const identificador = viatura.tipo === "VEICULO" ? viatura.matricula : viatura.parque
    const matchesSearch =
      searchTerm === "" ||
      identificador?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viatura.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viatura.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      viatura.ano.toString().includes(searchTerm) ||
      (viatura.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    
    const matchesTipo = filterTipo === "all" || viatura.tipo === filterTipo
    const matchesMarca = filterMarca === "all" || viatura.marca === filterMarca
    const matchesModelo = filterModelo === "all" || viatura.modelo === filterModelo
    const matchesAno = filterAno === "all" || viatura.ano.toString() === filterAno
    
    return matchesSearch && matchesTipo && matchesMarca && matchesModelo && matchesAno
  })

  const hasActiveFilters = filterTipo !== "all" || filterMarca !== "all" || filterModelo !== "all" || filterAno !== "all" || searchTerm !== ""

  const clearAllFilters = () => {
    setSearchTerm("")
    setFilterTipo("all")
    setFilterMarca("all")
    setFilterModelo("all")
    setFilterAno("all")
  }

  // Obter valores únicos para filtros
  const marcas = Array.from(new Set(viaturas.map((v) => v.marca))).sort()
  const modelos = Array.from(new Set(viaturas.map((v) => v.modelo))).sort()
  const anos = Array.from(new Set(viaturas.map((v) => v.ano))).sort((a, b) => b - a)

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("vehicles.title")}</h1>
        <Link href="/module-equipament/admin/equipment/new">
          <Button>
            <Plus className="mr-1 sm:mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Novo Equipamento</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros e Pesquisa
          </h2>
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs h-8"
            >
              <X className="h-3 w-3 mr-1" />
              Limpar Filtros
            </Button>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <div className="relative">
              <Input
                id="search"
                placeholder="Buscar por identificador, marca, modelo..."
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
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="VEICULO">Veículo</SelectItem>
              <SelectItem value="MAQUINA">Máquina</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterMarca} onValueChange={setFilterMarca}>
            <SelectTrigger id="filter-marca" className="h-9">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as marcas</SelectItem>
              {marcas.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterModelo} onValueChange={setFilterModelo}>
            <SelectTrigger id="filter-modelo" className="h-9">
              <SelectValue placeholder="Modelo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os modelos</SelectItem>
              {modelos.map((modelo) => (
                <SelectItem key={modelo} value={modelo}>
                  {modelo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filterAno} onValueChange={setFilterAno}>
            <SelectTrigger id="filter-ano" className="h-9">
              <SelectValue placeholder="Ano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os anos</SelectItem>
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
            <span className="font-semibold">{filteredViaturas.length}</span> de <span className="font-semibold">{viaturas.length}</span> equipamentos
            {hasActiveFilters && (
              <span className="ml-2 text-blue-600 dark:text-blue-400">
                (filtros ativos)
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
                  "{searchTerm}"
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Cards View */}
  <div className="block sm:hidden space-y-4">
        {filteredViaturas.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
            {viaturas.length === 0 ? t("vehicles.noVehicles") : "Nenhum equipamento encontrado com os filtros aplicados"}
          </div>
        ) : (
          filteredViaturas.map((viatura) => (
            <div key={viatura.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
              <div className="flex gap-4 mb-3">
                {viatura.foto ? (
                  <div className="w-20 h-20 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 flex-shrink-0">
                    <img
                      src={viatura.foto}
                      alt={viatura.tipo === "VEICULO" ? viatura.matricula : viatura.parque}
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
                    {viatura.tipo === "VEICULO" ? (
                      <Car className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    ) : (
                      <Wrench className="h-4 w-4 text-orange-600 flex-shrink-0" />
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      viatura.tipo === "VEICULO"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                        : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                    }`}>
                      {viatura.tipo === "VEICULO" ? "Veículo" : "Máquina"}
                    </span>
                  </div>
                  <h3 className="font-semibold text-lg dark:text-white truncate">
                    {viatura.tipo === "VEICULO" ? viatura.matricula : viatura.parque}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{viatura.marca} {viatura.modelo}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Ano: {viatura.ano}</p>
                  {viatura.tipo === "VEICULO" ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Matrícula</p>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Parque</p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Link href={`/module-equipament/admin/equipment/${viatura.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Ver/Editar
                  </Button>
                </Link>
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
                      {viatura.qrCode && (viatura.matricula || viatura.parque) && (
                        <>
                          <Link href={`/equipament-view/${viatura.tipo === "VEICULO" ? viatura.matricula : viatura.parque}`} target="_blank" className="flex-1">
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
              <TableHead className="dark:text-gray-300">Tipo</TableHead>
              <TableHead className="dark:text-gray-300">Foto</TableHead>
              <TableHead className="dark:text-gray-300">Identificador</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.brand")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.model")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("vehicles.year")}</TableHead>
              <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredViaturas.length === 0 ? (
              <TableRow className="dark:border-gray-700">
                <TableCell colSpan={7} className="text-center dark:text-gray-400">
                  {viaturas.length === 0 ? t("vehicles.noVehicles") : "Nenhum equipamento encontrado com os filtros aplicados"}
                </TableCell>
              </TableRow>
            ) : (
              filteredViaturas.map((viatura) => (
                <TableRow key={viatura.id} className="dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {viatura.tipo === "VEICULO" ? (
                        <Car className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Wrench className="h-4 w-4 text-orange-600" />
                      )}
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        viatura.tipo === "VEICULO"
                          ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                          : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                      }`}>
                        {viatura.tipo === "VEICULO" ? "Veículo" : "Máquina"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {viatura.foto ? (
                      <div className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img
                          src={viatura.foto}
                          alt={viatura.tipo === "VEICULO" ? viatura.matricula : viatura.parque}
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
                        {viatura.tipo === "VEICULO" ? viatura.matricula : viatura.parque}
                      </div>
                      {viatura.tipo === "VEICULO" ? (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Matrícula</div>
                      ) : (
                        <div className="text-xs text-gray-500 dark:text-gray-400">Parque</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="dark:text-gray-300 font-medium">{viatura.marca}</TableCell>
                  <TableCell className="dark:text-gray-300">{viatura.modelo}</TableCell>
                  <TableCell className="dark:text-gray-300">{viatura.ano}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/module-equipament/admin/equipment/${viatura.id}`}>
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
                          setDeleteTarget(viatura)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {viatura.qrCode && (viatura.matricula || viatura.parque) && (
                        <>
                          <Link href={`/equipament-view/${viatura.tipo === "VEICULO" ? viatura.matricula : viatura.parque}`} target="_blank">
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

