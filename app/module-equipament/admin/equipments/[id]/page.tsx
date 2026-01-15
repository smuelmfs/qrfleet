"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { Plus, Edit, Trash2, File, Upload, X, ArrowLeft, Calendar, Tag, Building2, Car, Wrench, QrCode, Image as ImageIcon, Eye, EyeOff } from "lucide-react"
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Equipamento {
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
  publicoFoto?: boolean
  publicoDescricao?: boolean
  publicoMarca?: boolean
  publicoModelo?: boolean
  publicoAno?: boolean
  documentos: Documento[]
  eventos: Evento[]
}

interface Documento {
  id: string
  titulo: string
  descricao?: string
  arquivo: string
  tipo: string
  dataVencimento?: string
  publico?: boolean
}

interface Evento {
  id: string
  titulo: string
  descricao?: string
  tipo: string
  data: string
  custo?: number
  publico?: boolean
}

export default function EquipamentoDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [equipamento, setEquipamento] = useState<Equipamento | null>(null)
  const [activeTab, setActiveTab] = useState<string>("info")
  
  // Estados para edição do equipamento
  const [editEquipamentoOpen, setEditEquipamentoOpen] = useState(false)
  const [equipamentoFormData, setEquipamentoFormData] = useState({
    tipo: "VEICULO",
    matricula: "",
    parque: "",
    modelo: "",
    marca: "",
    ano: "",
    foto: "",
    descricao: "",
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>("")
  const [uploading, setUploading] = useState(false)

  // Estados para documentos
  const [documentoOpen, setDocumentoOpen] = useState(false)
  const [editingDocumento, setEditingDocumento] = useState<Documento | null>(null)
  const [documentoFormData, setDocumentoFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "",
    dataVencimento: "",
  })
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null)
  const [deleteDocDialogOpen, setDeleteDocDialogOpen] = useState(false)
  const [deleteDocTarget, setDeleteDocTarget] = useState<Documento | null>(null)
  const [isDraggingDoc, setIsDraggingDoc] = useState(false)
  const [isDraggingFoto, setIsDraggingFoto] = useState(false)

  // Estado para visibilidade pública
  const [visibilidadePublica, setVisibilidadePublica] = useState({
    publicoFoto: false,
    publicoDescricao: false,
    publicoMarca: true,
    publicoModelo: true,
    publicoAno: true,
  })

  // Handlers para drag and drop de documentos
  const handleDragOverDoc = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingDoc(true)
  }

  const handleDragLeaveDoc = () => {
    setIsDraggingDoc(false)
  }

  const handleDropDoc = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingDoc(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Erro",
          description: "Arquivo muito grande. Tamanho máximo: 10MB",
          variant: "destructive",
        })
        return
      }
      setSelectedDocFile(file)
    }
  }

  // Handlers para drag and drop de foto
  const handleDragOverFoto = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFoto(true)
  }

  const handleDragLeaveFoto = () => {
    setIsDraggingFoto(false)
  }

  const handleDropFoto = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDraggingFoto(false)
    const file = e.dataTransfer.files[0]
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

  // Estados para eventos
  const [eventoOpen, setEventoOpen] = useState(false)
  const [editingEvento, setEditingEvento] = useState<Evento | null>(null)
  const [eventoFormData, setEventoFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "MANUTENCAO",
    data: "",
    custo: "",
  })
  const [deleteEventoDialogOpen, setDeleteEventoDialogOpen] = useState(false)
  const [deleteEventoTarget, setDeleteEventoTarget] = useState<Evento | null>(null)

  const fetchEquipamento = useCallback(async () => {
    try {
      const res = await fetch(`/api/viaturas/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setEquipamento(data)
        setEquipamentoFormData({
          tipo: data.tipo || "VEICULO",
          matricula: data.matricula || "",
          parque: data.parque || "",
          modelo: data.modelo || "",
          marca: data.marca || "",
          ano: data.ano?.toString() || "",
          foto: data.foto || "",
          descricao: data.descricao || "",
        })
        setPreview(data.foto || "")
        setVisibilidadePublica({
          publicoFoto: data.publicoFoto ?? false,
          publicoDescricao: data.publicoDescricao ?? false,
          publicoMarca: data.publicoMarca ?? true,
          publicoModelo: data.publicoModelo ?? true,
          publicoAno: data.publicoAno ?? true,
        })
      } else {
        toast({
          title: "Erro",
          description: "Equipamento não encontrado",
          variant: "destructive",
        })
        router.push("/module-equipament/admin/equipment")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar equipamento",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [params.id, router, toast])

  useEffect(() => {
    fetchEquipamento()
  }, [fetchEquipamento])

  // Ler query parameter para definir aba ativa
  useEffect(() => {
    const tab = searchParams.get("tab")
    if (tab && ["info", "documents", "events", "visibilidade"].includes(tab)) {
      setActiveTab(tab)
    }
  }, [searchParams])

  const handleEquipamentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      let fotoUrl = equipamentoFormData.foto

      if (selectedFile) {
        setUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", selectedFile)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadRes.ok) {
          toast({
            title: "Erro",
            description: "Erro ao fazer upload da imagem",
            variant: "destructive",
          })
          setUploading(false)
          return
        }

        const { url } = await uploadRes.json()
        fotoUrl = url
        setUploading(false)
      }

      const res = await fetch(`/api/viaturas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...equipamentoFormData, foto: fotoUrl }),
      })

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Equipamento atualizado com sucesso",
        })
        setEditEquipamentoOpen(false)
        setSelectedFile(null)
        fetchEquipamento()
      } else {
        const error = await res.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao atualizar equipamento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar equipamento",
        variant: "destructive",
      })
    }
  }

  const handleDocumentoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipamento) return

    try {
      let arquivoUrl = editingDocumento?.arquivo || ""

      if (selectedDocFile) {
        setUploading(true)
        const uploadFormData = new FormData()
        uploadFormData.append("file", selectedDocFile)
        uploadFormData.append("fileType", "document")

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: uploadFormData,
        })

        if (!uploadRes.ok) {
          toast({
            title: "Erro",
            description: "Erro ao fazer upload do arquivo",
            variant: "destructive",
          })
          setUploading(false)
          return
        }

        const { url } = await uploadRes.json()
        arquivoUrl = url
        setUploading(false)
      }

      const url = editingDocumento
        ? `/api/documentos/${editingDocumento.id}`
        : "/api/documentos"
      const method = editingDocumento ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...documentoFormData,
          viaturaId: equipamento.id,
          arquivo: arquivoUrl,
        }),
      })

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: editingDocumento
            ? "Documento atualizado com sucesso"
            : "Documento criado com sucesso",
        })
        setDocumentoOpen(false)
        setEditingDocumento(null)
        setDocumentoFormData({
          titulo: "",
          descricao: "",
          tipo: "",
          dataVencimento: "",
        })
        setSelectedDocFile(null)
        fetchEquipamento()
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

  const handleEventoSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!equipamento) return

    try {
      const url = editingEvento
        ? `/api/eventos/${editingEvento.id}`
        : "/api/eventos"
      const method = editingEvento ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...eventoFormData,
          viaturaId: equipamento.id,
        }),
      })

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: editingEvento
            ? "Evento atualizado com sucesso"
            : "Evento criado com sucesso",
        })
        setEventoOpen(false)
        setEditingEvento(null)
        setEventoFormData({
          titulo: "",
          descricao: "",
          tipo: "MANUTENCAO",
          data: "",
          custo: "",
        })
        fetchEquipamento()
      } else {
        const error = await res.json()
        toast({
          title: "Erro",
          description: error.error || "Erro ao salvar evento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar evento",
        variant: "destructive",
      })
    }
  }

  const handleDeleteDocumento = async (id: string) => {
    try {
      const res = await fetch(`/api/documentos/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Documento deletado com sucesso",
        })
        fetchEquipamento()
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

  const handleDeleteEvento = async (id: string) => {
    try {
      const res = await fetch(`/api/eventos/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast({
          title: "Sucesso",
          description: "Evento deletado com sucesso",
        })
        fetchEquipamento()
      } else {
        toast({
          title: "Erro",
          description: "Erro ao deletar evento",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao deletar evento",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }
  
  if (!equipamento) {
    return null
  }

  const identificador = equipamento.tipo === "VEICULO" 
    ? equipamento.matricula 
    : equipamento.parque;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push("/module-equipament/admin/equipment")}
            className="mb-0"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          {equipamento.qrCode && (
            <Button
              variant="outline"
              onClick={() => router.push(`/module-equipament/admin/equipment/${equipamento.id}/qr`)}
            >
              <QrCode className="mr-2 h-4 w-4" />
              Ver QR Code
            </Button>
          )}
        </div>

        {/* Hero Section */}
        <Card className="overflow-hidden shadow-lg dark:bg-gray-800">
          <div className="grid md:grid-cols-2 gap-6 p-6">
            {equipamento.foto ? (
              <div className="relative group">
                <img
                  src={equipamento.foto}
                  alt={identificador || "Equipamento"}
                  className="w-full h-80 object-cover rounded-lg shadow-md"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
              </div>
            ) : (
              <div className="w-full h-80 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-24 w-24 text-gray-400" />
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {equipamento.tipo === "VEICULO" ? (
                    <Car className="h-6 w-6 text-blue-600" />
                  ) : (
                    <Wrench className="h-6 w-6 text-orange-600" />
                  )}
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    equipamento.tipo === "VEICULO"
                      ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                      : "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  }`}>
                    {equipamento.tipo === "VEICULO" ? "Veículo" : "Máquina"}
                  </span>
                </div>
                <h1 className="text-3xl font-bold mb-2">{identificador}</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  {equipamento.marca} {equipamento.modelo}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t dark:border-gray-700">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Tag className="h-4 w-4" />
                    <span>Identificação</span>
                  </div>
                  <p className="text-lg font-semibold">
                    {equipamento.tipo === "VEICULO" 
                      ? equipamento.matricula || "-"
                      : equipamento.parque || "-"}
                  </p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Calendar className="h-4 w-4" />
                    <span>Ano</span>
                  </div>
                  <p className="text-lg font-semibold">{equipamento.ano}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Building2 className="h-4 w-4" />
                    <span>Marca</span>
                  </div>
                  <p className="text-lg font-semibold">{equipamento.marca}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                    <Car className="h-4 w-4" />
                    <span>Modelo</span>
                  </div>
                  <p className="text-lg font-semibold">{equipamento.modelo}</p>
                </div>
              </div>

              {equipamento.descricao && (
                <div className="pt-4 border-t dark:border-gray-700">
                  <Label className="text-sm font-semibold mb-2 block">Descrição</Label>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {equipamento.descricao}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Informações
            </TabsTrigger>
            <TabsTrigger value="documents" className="flex items-center gap-2">
              <File className="h-4 w-4" />
              Documentos
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                {equipamento.documentos.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Eventos
              <span className="ml-1 px-2 py-0.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                {equipamento.eventos.length}
              </span>
            </TabsTrigger>
            <TabsTrigger value="visibilidade" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Visibilidade
            </TabsTrigger>
          </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card className="shadow-md dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="h-5 w-5" />
                    Detalhes do Equipamento
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Visualize e edite as informações do equipamento
                  </CardDescription>
                </div>
                <Button onClick={() => setEditEquipamentoOpen(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Editar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Tipo de Equipamento
                    </Label>
                    <p className="text-lg font-semibold mt-1">
                      {equipamento.tipo === "VEICULO" ? "Veículo" : "Máquina"}
                    </p>
                  </div>
                  {equipamento.tipo === "VEICULO" ? (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Matrícula
                      </Label>
                      <p className="text-lg font-semibold mt-1">
                        {equipamento.matricula || "-"}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                        Parque
                      </Label>
                      <p className="text-lg font-semibold mt-1">
                        {equipamento.parque || "-"}
                      </p>
                    </div>
                  )}
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Ano
                    </Label>
                    <p className="text-lg font-semibold mt-1">{equipamento.ano}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Marca
                    </Label>
                    <p className="text-lg font-semibold mt-1">{equipamento.marca}</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Modelo
                    </Label>
                    <p className="text-lg font-semibold mt-1">{equipamento.modelo}</p>
                  </div>
                </div>
                {equipamento.descricao && (
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg md:col-span-2">
                    <Label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      Descrição
                    </Label>
                    <p className="text-sm mt-2 text-gray-700 dark:text-gray-300 leading-relaxed">
                      {equipamento.descricao}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-4">
          <Card className="shadow-md dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <File className="h-5 w-5" />
                    Documentos
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Gerencie os documentos associados a este equipamento
                  </CardDescription>
                </div>
                <Dialog open={documentoOpen} onOpenChange={setDocumentoOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingDocumento(null)
                        setDocumentoFormData({
                          titulo: "",
                          descricao: "",
                          tipo: "",
                          dataVencimento: "",
                        })
                        setSelectedDocFile(null)
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Documento
                    </Button>
                  </DialogTrigger>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Dialog open={documentoOpen} onOpenChange={setDocumentoOpen}>
                <DialogTrigger asChild>
                  <Button className="hidden" />
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <form onSubmit={handleDocumentoSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingDocumento ? "Editar Documento" : "Novo Documento"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="doc-titulo">Título *</Label>
                      <Input
                        id="doc-titulo"
                        value={documentoFormData.titulo}
                        onChange={(e) =>
                          setDocumentoFormData({
                            ...documentoFormData,
                            titulo: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="doc-descricao">Descrição</Label>
                      <Input
                        id="doc-descricao"
                        value={documentoFormData.descricao}
                        onChange={(e) =>
                          setDocumentoFormData({
                            ...documentoFormData,
                            descricao: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="doc-tipo">Tipo *</Label>
                      <Input
                        id="doc-tipo"
                        value={documentoFormData.tipo}
                        onChange={(e) =>
                          setDocumentoFormData({
                            ...documentoFormData,
                            tipo: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="doc-vencimento">Data de Vencimento</Label>
                      <Input
                        id="doc-vencimento"
                        type="date"
                        value={documentoFormData.dataVencimento}
                        onChange={(e) =>
                          setDocumentoFormData({
                            ...documentoFormData,
                            dataVencimento: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="doc-arquivo">Arquivo *</Label>
                      {!selectedDocFile && editingDocumento && (
                        <div className="text-sm text-gray-600">
                          Arquivo atual: {editingDocumento.arquivo.split("/").pop()}
                        </div>
                      )}
                      {selectedDocFile ? (
                        <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <File className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium">{selectedDocFile.name}</span>
                              <span className="text-xs text-gray-500">
                                ({(selectedDocFile.size / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedDocFile(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          onDragOver={handleDragOverDoc}
                          onDragLeave={handleDragLeaveDoc}
                          onDrop={handleDropDoc}
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                            isDraggingDoc
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                          }`}
                        >
                          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                          <p className="text-sm font-medium mb-2">
                            {isDraggingDoc ? "Solte o arquivo aqui" : "Arraste e solte o arquivo aqui"}
                          </p>
                          <p className="text-xs text-gray-500 mb-4">ou</p>
                          <Input
                            id="doc-arquivo"
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.webp"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  toast({
                                    title: "Erro",
                                    description: "Arquivo muito grande. Tamanho máximo: 10MB",
                                    variant: "destructive",
                                  })
                                  return
                                }
                                setSelectedDocFile(file)
                              }
                            }}
                            className="hidden"
                            required={!editingDocumento}
                          />
                          <Label
                            htmlFor="doc-arquivo"
                            className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                          >
                            Selecionar arquivo
                          </Label>
                          <p className="text-xs text-gray-500 mt-2">
                            Formatos: PDF, DOC, DOCX, XLS, XLSX, TXT, JPG, PNG, WEBP (máx. 10MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setDocumentoOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={uploading}>
                      {uploading ? "Enviando..." : "Salvar"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            {equipamento.documentos.length === 0 ? (
              <div className="py-12 text-center">
                <File className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum documento cadastrado</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Clique em "Adicionar Documento" para começar
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {equipamento.documentos.map((doc) => (
                  <Card key={doc.id} className="hover:shadow-lg transition-shadow dark:bg-gray-700">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-base mb-1">{doc.titulo}</CardTitle>
                          <CardDescription className="text-xs">
                            {doc.tipo}
                          </CardDescription>
                        </div>
                        <File className="h-5 w-5 text-blue-500 flex-shrink-0 ml-2" />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {doc.descricao && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                          {doc.descricao}
                        </p>
                      )}
                      {doc.dataVencimento && (
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
                          <Calendar className="h-3 w-3" />
                          <span>Vence em: {new Date(doc.dataVencimento).toLocaleDateString("pt-BR")}</span>
                        </div>
                      )}
                      <div className="flex gap-2 pt-3 border-t dark:border-gray-600">
                        {doc.arquivo && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => window.open(doc.arquivo, "_blank")}
                          >
                            <File className="h-3 w-3 mr-1" />
                            Abrir
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingDocumento(doc)
                            setDocumentoFormData({
                              titulo: doc.titulo,
                              descricao: doc.descricao || "",
                              tipo: doc.tipo,
                              dataVencimento: doc.dataVencimento
                                ? new Date(doc.dataVencimento).toISOString().split("T")[0]
                                : "",
                            })
                            setDocumentoOpen(true)
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeleteDocTarget(doc)
                            setDeleteDocDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card className="shadow-md dark:bg-gray-800">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Eventos
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Gerencie os eventos e histórico do equipamento
                  </CardDescription>
                </div>
                <Dialog open={eventoOpen} onOpenChange={setEventoOpen}>
                  <DialogTrigger asChild>
                    <Button
                      onClick={() => {
                        setEditingEvento(null)
                        setEventoFormData({
                          titulo: "",
                          descricao: "",
                          tipo: "MANUTENCAO",
                          data: "",
                          custo: "",
                        })
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Adicionar Evento
                    </Button>
                  </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleEventoSubmit}>
                  <DialogHeader>
                    <DialogTitle>
                      {editingEvento ? "Editar Evento" : "Novo Evento"}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="evento-titulo">Título *</Label>
                      <Input
                        id="evento-titulo"
                        value={eventoFormData.titulo}
                        onChange={(e) =>
                          setEventoFormData({
                            ...eventoFormData,
                            titulo: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="evento-descricao">Descrição</Label>
                      <Input
                        id="evento-descricao"
                        value={eventoFormData.descricao}
                        onChange={(e) =>
                          setEventoFormData({
                            ...eventoFormData,
                            descricao: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="evento-tipo">Tipo *</Label>
                      <Select
                        value={eventoFormData.tipo}
                        onValueChange={(value) =>
                          setEventoFormData({ ...eventoFormData, tipo: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MANUTENCAO">Manutenção</SelectItem>
                          <SelectItem value="REPARACAO">Reparação</SelectItem>
                          <SelectItem value="INSPECAO">Inspeção</SelectItem>
                          <SelectItem value="COMBUSTIVEL">Combustível</SelectItem>
                          <SelectItem value="PECAS_TROCADAS">Peças Trocadas</SelectItem>
                          <SelectItem value="REVISAO">Revisão</SelectItem>
                          <SelectItem value="OUTRO">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="evento-data">Data *</Label>
                      <Input
                        id="evento-data"
                        type="date"
                        value={eventoFormData.data}
                        onChange={(e) =>
                          setEventoFormData({
                            ...eventoFormData,
                            data: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="evento-custo">Custo</Label>
                      <Input
                        id="evento-custo"
                        type="number"
                        step="0.01"
                        value={eventoFormData.custo}
                        onChange={(e) =>
                          setEventoFormData({
                            ...eventoFormData,
                            custo: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEventoOpen(false)}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit">Salvar</Button>
                  </DialogFooter>
                </form>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>

            {equipamento.eventos.length === 0 ? (
              <div className="py-12 text-center">
                <Calendar className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500 dark:text-gray-400">Nenhum evento cadastrado</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                  Clique em "Adicionar Evento" para começar
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                {equipamento.eventos.map((evento) => {
                  const tipoColors: Record<string, string> = {
                    MANUTENCAO: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
                    REPARACAO: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
                    INSPECAO: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
                    COMBUSTIVEL: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
                    PECAS_TROCADAS: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
                    REVISAO: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
                  }
                  return (
                    <Card key={evento.id} className="hover:shadow-lg transition-shadow dark:bg-gray-700">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base mb-2">{evento.titulo}</CardTitle>
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${tipoColors[evento.tipo] || "bg-gray-100 text-gray-800"}`}>
                              {evento.tipo.replace("_", " ")}
                            </span>
                          </div>
                          <Calendar className="h-5 w-5 text-green-500 flex-shrink-0 ml-2" />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(evento.data).toLocaleDateString("pt-BR")}</span>
                        </div>
                        {evento.descricao && (
                          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
                            {evento.descricao}
                          </p>
                        )}
                        {evento.custo && (
                          <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-3">
                            €{evento.custo.toFixed(2)}
                          </div>
                        )}
                        <div className="flex gap-2 pt-3 border-t dark:border-gray-600">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingEvento(evento)
                              setEventoFormData({
                                titulo: evento.titulo,
                                descricao: evento.descricao || "",
                                tipo: evento.tipo,
                                data: new Date(evento.data).toISOString().split("T")[0],
                                custo: evento.custo?.toString() || "",
                              })
                              setEventoOpen(true)
                            }}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeleteEventoTarget(evento)
                              setDeleteEventoDialogOpen(true)
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="visibilidade" className="space-y-4">
          <Card className="shadow-md dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Visibilidade Pública
              </CardTitle>
              <CardDescription>
                Configure quais informações do equipamento serão visíveis na página pública
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Informações do Equipamento */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg dark:text-white">Informações do Equipamento</h3>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibilidadePublica.publicoMarca}
                      onChange={(e) =>
                        setVisibilidadePublica({
                          ...visibilidadePublica,
                          publicoMarca: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium dark:text-gray-300">Marca</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibilidadePublica.publicoModelo}
                      onChange={(e) =>
                        setVisibilidadePublica({
                          ...visibilidadePublica,
                          publicoModelo: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium dark:text-gray-300">Modelo</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibilidadePublica.publicoAno}
                      onChange={(e) =>
                        setVisibilidadePublica({
                          ...visibilidadePublica,
                          publicoAno: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium dark:text-gray-300">Ano</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibilidadePublica.publicoFoto}
                      onChange={(e) =>
                        setVisibilidadePublica({
                          ...visibilidadePublica,
                          publicoFoto: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium dark:text-gray-300">Foto</span>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={visibilidadePublica.publicoDescricao}
                      onChange={(e) =>
                        setVisibilidadePublica({
                          ...visibilidadePublica,
                          publicoDescricao: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium dark:text-gray-300">Descrição</span>
                  </label>
                </div>
              </div>

              {/* Documentos */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-lg dark:text-white">Documentos</h3>
                {equipamento.documentos.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhum documento cadastrado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {equipamento.documentos.map((doc) => (
                      <label
                        key={doc.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={doc.publico ?? false}
                            onChange={async (e) => {
                              try {
                                const res = await fetch(`/api/documentos/${doc.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    ...doc,
                                    publico: e.target.checked,
                                  }),
                                })
                                if (res.ok) {
                                  fetchEquipamento()
                                  toast({
                                    title: "Sucesso",
                                    description: "Visibilidade do documento atualizada",
                                  })
                                }
                              } catch (error) {
                                toast({
                                  title: "Erro",
                                  description: "Erro ao atualizar visibilidade",
                                  variant: "destructive",
                                })
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium dark:text-gray-300">
                            {doc.titulo}
                          </span>
                        </div>
                        {doc.publico && (
                          <Eye className="h-4 w-4 text-green-500" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Eventos */}
              <div className="space-y-4 border-t pt-4">
                <h3 className="font-semibold text-lg dark:text-white">Eventos</h3>
                {equipamento.eventos.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Nenhum evento cadastrado
                  </p>
                ) : (
                  <div className="space-y-2">
                    {equipamento.eventos.map((evento) => (
                      <label
                        key={evento.id}
                        className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={evento.publico ?? false}
                            onChange={async (e) => {
                              try {
                                const res = await fetch(`/api/eventos/${evento.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    ...evento,
                                    publico: e.target.checked,
                                  }),
                                })
                                if (res.ok) {
                                  fetchEquipamento()
                                  toast({
                                    title: "Sucesso",
                                    description: "Visibilidade do evento atualizada",
                                  })
                                }
                              } catch (error) {
                                toast({
                                  title: "Erro",
                                  description: "Erro ao atualizar visibilidade",
                                  variant: "destructive",
                                })
                              }
                            }}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm font-medium dark:text-gray-300">
                            {evento.titulo}
                          </span>
                        </div>
                        {evento.publico && (
                          <Eye className="h-4 w-4 text-green-500" />
                        )}
                      </label>
                    ))}
                  </div>
                )}
              </div>

              {/* Botão Salvar */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/viaturas/${params.id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(visibilidadePublica),
                      })
                      if (res.ok) {
                        toast({
                          title: "Sucesso",
                          description: "Configurações de visibilidade salvas",
                        })
                        fetchEquipamento()
                      } else {
                        toast({
                          title: "Erro",
                          description: "Erro ao salvar configurações",
                          variant: "destructive",
                        })
                      }
                    } catch (error) {
                      toast({
                        title: "Erro",
                        description: "Erro ao salvar configurações",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  Salvar Configurações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog de edição do equipamento */}
      <Dialog open={editEquipamentoOpen} onOpenChange={setEditEquipamentoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleEquipamentoSubmit}>
            <DialogHeader>
              <DialogTitle>Editar Equipamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={equipamentoFormData.tipo}
                  onValueChange={(value) =>
                    setEquipamentoFormData({ ...equipamentoFormData, tipo: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VEICULO">Veículo</SelectItem>
                    <SelectItem value="MAQUINA">Máquina</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {equipamentoFormData.tipo === "VEICULO" ? (
                <div className="grid gap-2">
                  <Label htmlFor="matricula">Matrícula *</Label>
                  <Input
                    id="matricula"
                    value={equipamentoFormData.matricula}
                    onChange={(e) =>
                      setEquipamentoFormData({
                        ...equipamentoFormData,
                        matricula: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              ) : (
                <div className="grid gap-2">
                  <Label htmlFor="parque">Parque *</Label>
                  <Input
                    id="parque"
                    value={equipamentoFormData.parque}
                    onChange={(e) =>
                      setEquipamentoFormData({
                        ...equipamentoFormData,
                        parque: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              )}
              <div className="grid gap-2">
                <Label htmlFor="marca">Marca *</Label>
                <Input
                  id="marca"
                  value={equipamentoFormData.marca}
                  onChange={(e) =>
                    setEquipamentoFormData({
                      ...equipamentoFormData,
                      marca: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="modelo">Modelo *</Label>
                <Input
                  id="modelo"
                  value={equipamentoFormData.modelo}
                  onChange={(e) =>
                    setEquipamentoFormData({
                      ...equipamentoFormData,
                      modelo: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ano">Ano *</Label>
                <Input
                  id="ano"
                  type="number"
                  value={equipamentoFormData.ano}
                  onChange={(e) =>
                    setEquipamentoFormData({
                      ...equipamentoFormData,
                      ano: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="foto">Foto</Label>
                {preview ? (
                  <div className="relative">
                    <img
                      src={preview}
                      alt="Preview"
                      className="w-full max-w-md h-48 object-cover rounded border"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => {
                        setSelectedFile(null)
                        setPreview("")
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div
                    onDragOver={handleDragOverFoto}
                    onDragLeave={handleDragLeaveFoto}
                    onDrop={handleDropFoto}
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      isDraggingFoto
                        ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                        : "border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600"
                    }`}
                  >
                    <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-sm font-medium mb-2">
                      {isDraggingFoto ? "Solte a imagem aqui" : "Arraste e solte a imagem aqui"}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">ou</p>
                    <Input
                      id="foto"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
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
                      }}
                      className="hidden"
                    />
                    <Label
                      htmlFor="foto"
                      className="cursor-pointer inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                    >
                      Selecionar imagem
                    </Label>
                    <p className="text-xs text-gray-500 mt-2">
                      Formatos: JPG, PNG, WEBP (máx. 3MB)
                    </p>
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição</Label>
                <Input
                  id="descricao"
                  value={equipamentoFormData.descricao}
                  onChange={(e) =>
                    setEquipamentoFormData({
                      ...equipamentoFormData,
                      descricao: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditEquipamentoOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={uploading}>
                {uploading ? "Enviando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteDocDialogOpen}
        onOpenChange={setDeleteDocDialogOpen}
        entityLabel="Documento"
        identifier={deleteDocTarget?.titulo || ""}
        onConfirm={async () => {
          if (!deleteDocTarget) return
          await handleDeleteDocumento(deleteDocTarget.id)
          setDeleteDocTarget(null)
        }}
      />

      <ConfirmDeleteDialog
        open={deleteEventoDialogOpen}
        onOpenChange={setDeleteEventoDialogOpen}
        entityLabel="Evento"
        identifier={deleteEventoTarget?.titulo || ""}
        onConfirm={async () => {
          if (!deleteEventoTarget) return
          await handleDeleteEvento(deleteEventoTarget.id)
          setDeleteEventoTarget(null)
        }}
      />
      </div>
    </div>
  )
}

