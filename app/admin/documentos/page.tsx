"use client"

import { useEffect, useState } from "react"
import { useI18n } from "@/contexts/I18nContext"
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog"
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
import { Plus, Edit, Trash2, Search, Filter, X, File, Upload } from "lucide-react"

interface Documento {
  id: string
  titulo: string
  descricao?: string
  arquivo: string
  tipo: string
  dataVencimento?: string
  viaturaId: string
  viatura?: {
    matricula: string
    modelo: string
  }
}

interface Viatura {
  id: string
  matricula: string
  modelo: string
}

export default function DocumentosPage() {
  const { t } = useI18n()
  const [documentos, setDocumentos] = useState<Documento[]>([])
  const [viaturas, setViaturas] = useState<Viatura[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Documento | null>(null)
  const { toast } = useToast()

  const [formData, setFormData] = useState({
    viaturaId: "",
    titulo: "",
    descricao: "",
    arquivo: "",
    tipo: "",
    dataVencimento: "",
  })
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [filterViatura, setFilterViatura] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [groupByViatura, setGroupByViatura] = useState<boolean>(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Documento | null>(null)

  useEffect(() => {
    fetchDocumentos()
    fetchViaturas()
  }, [])

  const fetchDocumentos = async () => {
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
  }

  const fetchViaturas = async () => {
    try {
      const res = await fetch("/api/viaturas")
      const data = await res.json()
      setViaturas(data)
    } catch (error) {
      console.error("Erro ao carregar viaturas:", error)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validar tamanho (10MB para documentos)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Tamanho máximo: 10MB",
          variant: "destructive",
        })
        return
      }
      setSelectedFile(file)
      setFileName(file.name)
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setFileName("")
    // Limpar o input file
    const fileInput = document.getElementById("arquivo") as HTMLInputElement
    if (fileInput) {
      fileInput.value = ""
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validação de campos obrigatórios
    if (!formData.viaturaId) {
      toast({
        title: "Erro",
        description: "Selecione uma viatura",
        variant: "destructive",
      })
      return
    }

    if (!formData.titulo || formData.titulo.trim() === "") {
      toast({
        title: "Erro",
        description: "Preencha o título do documento",
        variant: "destructive",
      })
      return
    }

    if (!formData.tipo || formData.tipo.trim() === "") {
      toast({
        title: "Erro",
        description: "Preencha o tipo do documento",
        variant: "destructive",
      })
      return
    }

    // Validar se há arquivo (novo ou atual)
    if (!selectedFile && !formData.arquivo) {
      toast({
        title: "Erro",
        description: "Selecione um arquivo para o documento",
        variant: "destructive",
      })
      return
    }

    try {
      let arquivoUrl = formData.arquivo

      // Se houver arquivo selecionado, fazer upload primeiro
      if (selectedFile) {
        setUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", selectedFile)
        uploadFormData.append("fileType", "document")

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadRes.ok) {
          const error = await uploadRes.json()
          toast({
            title: "Erro",
            description: error.error || "Erro ao fazer upload do arquivo",
            variant: "destructive",
          })
          setUploading(false)
          return
        }

        const { url } = await uploadRes.json()
        arquivoUrl = url
        setUploading(false)
      }

      const url = editing
        ? `/api/documentos/${editing.id}`
        : "/api/documentos"
      const method = editing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, arquivo: arquivoUrl }),
      })

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: editing
            ? "Documento atualizado com sucesso"
            : "Documento criado com sucesso",
        })
        setOpen(false)
        setEditing(null)
        setFormData({
          viaturaId: "",
          titulo: "",
          descricao: "",
          arquivo: "",
          tipo: "",
          dataVencimento: "",
        })
        setSelectedFile(null)
        setFileName("")
        fetchDocumentos()
      } else {
        const error = await res.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao salvar documento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar documento",
        variant: "destructive",
      })
    }
  }

  const handleEdit = (documento: Documento) => {
    setEditing(documento)
    setFormData({
      viaturaId: documento.viaturaId,
      titulo: documento.titulo,
      descricao: documento.descricao || "",
      arquivo: documento.arquivo,
      tipo: documento.tipo,
      dataVencimento: documento.dataVencimento
        ? new Date(documento.dataVencimento).toISOString().split("T")[0]
        : "",
    })
    setSelectedFile(null)
    setFileName("")
    setOpen(true)
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/documentos/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Documento deletado com sucesso",
        })
        fetchDocumentos()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao deletar documento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar documento",
        variant: "destructive",
      })
    }
  }

  // Filtrar documentos
  const filteredDocumentos = documentos.filter((doc) => {
    const matchesViatura = filterViatura === "all" || doc.viaturaId === filterViatura
    const matchesSearch =
      searchTerm === "" ||
      doc.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.viatura?.matricula.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.viatura?.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesViatura && matchesSearch
  })

  // Agrupar por viatura
  const groupedDocumentos = groupByViatura
    ? filteredDocumentos.reduce((acc, doc) => {
        const key = doc.viaturaId || "sem-viatura"
        if (!acc[key]) {
          acc[key] = {
            viatura: doc.viatura || { matricula: "Sem viatura", modelo: "" },
            documentos: [],
          }
        }
        acc[key].documentos.push(doc)
        return acc
      }, {} as Record<string, { viatura: { matricula: string; modelo: string }; documentos: Documento[] }>)
    : null

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t("documents.title")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditing(null)
                setFormData({
                  viaturaId: "",
                  titulo: "",
                  descricao: "",
                  arquivo: "",
                  tipo: "",
                  dataVencimento: "",
                })
                setSelectedFile(null)
                setFileName("")
              }}
            >
              <Plus className="mr-1 sm:mr-2 h-4 w-4" />
              <span className="hidden sm:inline">{t("documents.new")}</span>
              <span className="sm:hidden">{t("common.new")}</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editing ? t("documents.edit") : t("documents.new")}
                </DialogTitle>
                <DialogDescription>
                  {editing
                    ? t("form.updateInfo") + " " + t("documents.title").toLowerCase()
                    : t("form.fillData") + " " + t("documents.new").toLowerCase()}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="viaturaId">{t("events.vehicle")}</Label>
                  <Select
                    value={formData.viaturaId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, viaturaId: value })
                    }
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.selectVehicle")} />
                    </SelectTrigger>
                    <SelectContent>
                      {viaturas.map((viatura) => (
                        <SelectItem key={viatura.id} value={viatura.id}>
                          {viatura.matricula} - {viatura.modelo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="titulo">{t("documents.titleField")}</Label>
                  <Input
                    id="titulo"
                    value={formData.titulo}
                    onChange={(e) =>
                      setFormData({ ...formData, titulo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="descricao">{t("documents.description")}</Label>
                  <Input
                    id="descricao"
                    value={formData.descricao}
                    onChange={(e) =>
                      setFormData({ ...formData, descricao: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="arquivo">{t("documents.file")}</Label>
                  
                  {/* Arquivo novo selecionado */}
                  {selectedFile && (
                    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 relative">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <File className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {fileName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {formatFileSize(selectedFile.size)}
                          </p>
                          {editing && formData.arquivo && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                              {t("form.fileWillReplace")}
                            </p>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={handleRemoveFile}
                          aria-label="Remover arquivo"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Arquivo atual (quando editando e não há novo arquivo selecionado) */}
                  {formData.arquivo && !selectedFile && editing && (
                    <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-800/50 relative">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          <File className="h-8 w-8 text-gray-600 dark:text-gray-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                            {formData.arquivo.split("/").pop()}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {t("form.currentFile")}
                          </p>
                          <a
                            href={formData.arquivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-block"
                          >
                            {t("form.openFile")}
                          </a>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="flex-shrink-0 h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => {
                            setFormData({ ...formData, arquivo: "" })
                          }}
                          aria-label="Remover arquivo atual"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Input de arquivo - aparece quando não há arquivo novo selecionado E (não está editando OU não há arquivo atual) */}
                  {!selectedFile && (!editing || !formData.arquivo) && (
                    <div className="relative">
                      <Input
                        id="arquivo"
                        type="file"
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"
                        onChange={handleFileChange}
                        className="cursor-pointer"
                      />
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                        <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                          <Upload className="h-4 w-4" />
                          <span className="text-sm font-medium">{t("form.clickToSelect")}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {!selectedFile && (!editing || !formData.arquivo) && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t("form.maxSize")}: 10MB. {t("form.formats")}: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, WEBP
                    </p>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tipo">{t("documents.type")}</Label>
                  <Input
                    id="tipo"
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dataVencimento">{t("documents.expiration")}</Label>
                  <Input
                    id="dataVencimento"
                    type="date"
                    value={formData.dataVencimento}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        dataVencimento: e.target.value,
                      })
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
                    setFileName("")
                    const fileInput = document.getElementById("arquivo") as HTMLInputElement
                    if (fileInput) {
                      fileInput.value = ""
                    }
                  }}
                >
                  {t("common.cancel")}
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    uploading || 
                    !formData.viaturaId || 
                    !formData.titulo?.trim() || 
                    !formData.tipo?.trim() || 
                    (!selectedFile && !formData.arquivo)
                  }
                >
                  {uploading ? t("form.uploading") : t("common.save")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
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
                placeholder="Buscar por título, tipo, viatura..."
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
            <Label htmlFor="filter-viatura" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("common.filter")} {t("events.vehicle")}
            </Label>
            <Select value={filterViatura} onValueChange={setFilterViatura}>
              <SelectTrigger id="filter-viatura">
                <SelectValue placeholder={t("form.allVehicles")} />
              </SelectTrigger>
                <SelectContent>
                <SelectItem value="all">{t("form.allVehicles")}</SelectItem>
                {viaturas.map((viatura) => (
                  <SelectItem key={viatura.id} value={viatura.id}>
                    {viatura.matricula} - {viatura.modelo}
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
            variant={groupByViatura ? "default" : "outline"}
            size="sm"
            onClick={() => setGroupByViatura(!groupByViatura)}
          >
            {groupByViatura ? t("events.normalView") : t("events.groupByVehicle")}
          </Button>
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block sm:hidden space-y-4">
        {filteredDocumentos.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
            {documentos.length === 0
              ? t("documents.noDocuments")
              : t("common.noResults")}
          </div>
        ) : groupByViatura && groupedDocumentos ? (
          Object.entries(groupedDocumentos).map(([viaturaId, group]) => (
            <div key={viaturaId} className="space-y-3">
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded">
                <h3 className="font-bold text-lg dark:text-white">
                  {group.viatura.matricula} - {group.viatura.modelo}
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
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(documento)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                onClick={() => {
                  setDeleteTarget(documento)
                  setDeleteDialogOpen(true)
                }}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Deletar
                    </Button>
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
                  {documento.viatura
                    ? `${documento.viatura.matricula} - ${documento.viatura.modelo}`
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
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(documento)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                onClick={() => {
                  setDeleteTarget(documento)
                  setDeleteDialogOpen(true)
                }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Deletar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block space-y-4">
        {groupByViatura && groupedDocumentos ? (
          Object.entries(groupedDocumentos).map(([viaturaId, group]) => (
            <div key={viaturaId} className="bg-white rounded-lg shadow overflow-x-auto">
              <div className="bg-blue-50 border-b p-3">
                <h3 className="font-bold text-lg">
                  {group.viatura.matricula} - {group.viatura.modelo}
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
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(documento)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                        onClick={() => {
                          setDeleteTarget(documento)
                          setDeleteDialogOpen(true)
                        }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
                  <TableHead className="dark:text-gray-300">Título</TableHead>
                  <TableHead className="dark:text-gray-300">{t("events.vehicle")}</TableHead>
                  <TableHead className="dark:text-gray-300">Tipo</TableHead>
                  <TableHead className="dark:text-gray-300">Data Vencimento</TableHead>
                  <TableHead className="dark:text-gray-300">Ações</TableHead>
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
                        {documento.viatura
                          ? `${documento.viatura.matricula} - ${documento.viatura.modelo}`
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
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleEdit(documento)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                        onClick={() => {
                          setDeleteTarget(documento)
                          setDeleteDialogOpen(true)
                        }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entityLabel={t("documents.title")}
        identifier={deleteTarget ? deleteTarget.titulo : ""}
        onConfirm={async () => {
          if (!deleteTarget) return
          await handleDelete(deleteTarget.id)
          setDeleteTarget(null)
        }}
      />
    </div>
  )
}

