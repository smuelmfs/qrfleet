"use client"

import { useEffect, useState, useCallback } from "react"
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
import { Plus, Edit, Trash2, Search, Filter, X, Wrench, Fuel, Settings, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useI18n } from "@/contexts/I18nContext"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Evento {
  id: string
  titulo: string
  descricao?: string
  tipo: string
  data: string
  custo?: number
  viaturaId: string
  viatura?: {
    tipo: string
    matricula?: string
    parque?: string
    modelo: string
  }
}

interface Viatura {
  id: string
  tipo: string
  matricula?: string
  parque?: string
  modelo: string
}

export default function EventosPage() {
  const [eventos, setEventos] = useState<Evento[]>([])
  const [viaturas, setViaturas] = useState<Viatura[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const { t } = useI18n()
  const [filterViatura, setFilterViatura] = useState<string>("all")
  const [filterTipo, setFilterTipo] = useState<string>("all")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [groupByViatura, setGroupByViatura] = useState<boolean>(false)

  const fetchEventos = useCallback(async () => {
    try {
      const res = await fetch("/api/eventos")
      const data = await res.json()
      setEventos(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar eventos",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  const fetchViaturas = useCallback(async () => {
    try {
      const res = await fetch("/api/viaturas")
      if (!res.ok) {
        throw new Error("Erro ao buscar equipamentos")
      }
      const data = await res.json()
      // Garantir que data seja sempre um array
      setViaturas(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao carregar equipamentos:", error)
      setViaturas([]) // Garantir que seja um array mesmo em caso de erro
    }
  }, [])

  useEffect(() => {
    fetchEventos()
    fetchViaturas()
  }, [fetchEventos, fetchViaturas])

  const getEventoTipoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      MANUTENCAO: t("events.maintenance"),
      REPARACAO: t("events.repair"),
      INSPECAO: t("events.inspection"),
      COMBUSTIVEL: t("events.fuel"),
      PECAS_TROCADAS: t("events.partsReplaced"),
      REVISAO: t("events.revision"),
      OUTRO: t("events.other"),
    }
    return labels[tipo] || tipo
  }


  // Separar eventos passados e futuros
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const eventosPassados = eventos.filter((evento) => {
    const eventDate = new Date(evento.data)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate < today
  })

  const eventosFuturos = eventos.filter((evento) => {
    const eventDate = new Date(evento.data)
    eventDate.setHours(0, 0, 0, 0)
    return eventDate >= today
  })

  // Filtrar eventos passados
  const filteredEventosPassados = eventosPassados.filter((evento) => {
    const matchesViatura = filterViatura === "all" || evento.viaturaId === filterViatura
    const matchesTipo = filterTipo === "all" || evento.tipo === filterTipo
    const matchesSearch =
      searchTerm === "" ||
      evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evento.viatura?.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (evento.viatura?.parque?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      evento.viatura?.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesViatura && matchesTipo && matchesSearch
  })

  // Filtrar eventos futuros
  const filteredEventosFuturos = eventosFuturos.filter((evento) => {
    const matchesViatura = filterViatura === "all" || evento.viaturaId === filterViatura
    const matchesTipo = filterTipo === "all" || evento.tipo === filterTipo
    const matchesSearch =
      searchTerm === "" ||
      evento.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evento.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (evento.viatura?.matricula?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (evento.viatura?.parque?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      evento.viatura?.modelo.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesViatura && matchesTipo && matchesSearch
  })

  // Agrupar por viatura - Passados
  const groupedEventosPassados = groupByViatura
    ? filteredEventosPassados.reduce((acc, evento) => {
        const key = evento.viaturaId || "sem-viatura"
        if (!acc[key]) {
          acc[key] = {
            viatura: evento.viatura || { tipo: "VEICULO", matricula: t("pages.noEquipment"), modelo: "" },
            eventos: [],
          }
        }
        acc[key].eventos.push(evento)
        return acc
      }, {} as Record<string, { viatura: { tipo: string; matricula?: string; parque?: string; modelo: string }; eventos: Evento[] }>)
    : null

  // Agrupar por viatura - Futuros
  const groupedEventosFuturos = groupByViatura
    ? filteredEventosFuturos.reduce((acc, evento) => {
        const key = evento.viaturaId || "sem-viatura"
        if (!acc[key]) {
          acc[key] = {
            viatura: evento.viatura || { tipo: "VEICULO", matricula: t("pages.noEquipment"), modelo: "" },
            eventos: [],
          }
        }
        acc[key].eventos.push(evento)
        return acc
      }, {} as Record<string, { viatura: { tipo: string; matricula?: string; parque?: string; modelo: string }; eventos: Evento[] }>)
    : null

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("events.title")}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("pages.viewOnly").replace("{type}", t("pages.viewOnly.events"))}
          </p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-4 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <Label htmlFor="filter-viatura" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("pages.filter.equipment")}
            </Label>
            <Select value={filterViatura} onValueChange={setFilterViatura}>
              <SelectTrigger id="filter-viatura">
                <SelectValue placeholder={t("pages.filter.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("pages.filter.all")}</SelectItem>
                {Array.isArray(viaturas) && viaturas.map((viatura) => (
                  <SelectItem key={viatura.id} value={viatura.id}>
                    {viatura.tipo === "VEICULO" 
                      ? (viatura.matricula || "N/A")
                      : (viatura.parque || "N/A")} - {viatura.modelo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="filter-tipo" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {t("pages.filter.type")}
            </Label>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger id="filter-tipo">
                <SelectValue placeholder="Todos os tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="MANUTENCAO">{t("events.maintenance")}</SelectItem>
                <SelectItem value="REPARACAO">{t("events.repair")}</SelectItem>
                <SelectItem value="INSPECAO">{t("events.inspection")}</SelectItem>
                <SelectItem value="COMBUSTIVEL">{t("events.fuel")}</SelectItem>
                <SelectItem value="PECAS_TROCADAS">{t("events.partsReplaced")}</SelectItem>
                <SelectItem value="REVISAO">Revisão</SelectItem>
                <SelectItem value="OUTRO">{t("events.other")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {filteredEventosFuturos.length} {t("events.future")} • {filteredEventosPassados.length} {t("events.past")}
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

      {/* Seção: Eventos Futuros */}
      {filteredEventosFuturos.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-green-500"></span>
            {t("events.future")} ({filteredEventosFuturos.length})
          </h2>
          
          {/* Mobile Cards View - Futuros */}
          <div className="block sm:hidden space-y-4">
            {groupByViatura && groupedEventosFuturos ? (
              Object.entries(groupedEventosFuturos).map(([viaturaId, group]) => (
            <div key={viaturaId} className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded">
                  <h3 className="font-bold text-lg dark:text-white">
                    {group.viatura.tipo === "VEICULO" 
                      ? (group.viatura.matricula || "N/A")
                      : (group.viatura.parque || "N/A")} - {group.viatura.modelo}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {group.eventos.length} evento(s)
                  </p>
                </div>
                {group.eventos.map((evento) => (
                  <div key={evento.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 ml-4">
                    <div className="mb-3">
                      <h3 className="font-semibold text-lg dark:text-white">{evento.titulo}</h3>
                      <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>{t("events.type")}: {getEventoTipoLabel(evento.tipo)}</span>
                        <span>{new Date(evento.data).toLocaleDateString("pt-BR")}</span>
                        {evento.custo && <span>€{evento.custo.toFixed(2)}</span>}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/module-equipament/admin/equipment/${evento.viaturaId}?tab=events`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ))
            ) : (
              filteredEventosFuturos.map((evento) => (
                <div key={evento.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg dark:text-white">{evento.titulo}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {evento.viatura
                        ? `${evento.viatura.tipo === "VEICULO" 
                            ? (evento.viatura.matricula || "N/A")
                            : (evento.viatura.parque || "N/A")} - ${evento.viatura.modelo}`
                        : "-"}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Tipo: {evento.tipo}</span>
                      <span>{new Date(evento.data).toLocaleDateString("pt-BR")}</span>
                      {evento.custo && <span>€{evento.custo.toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/module-equipament/admin/equipment/${evento.viaturaId}?tab=events`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View - Futuros */}
          <div className="hidden sm:block space-y-4">
            {groupByViatura && groupedEventosFuturos ? (
              Object.entries(groupedEventosFuturos).map(([viaturaId, group]) => (
                <div key={viaturaId} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-b p-3">
                    <h3 className="font-bold text-lg dark:text-white">
                      {group.viatura.tipo === "VEICULO" 
                      ? (group.viatura.matricula || "N/A")
                      : (group.viatura.parque || "N/A")} - {group.viatura.modelo}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {group.eventos.length} evento(s)
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">{t("events.titleField")}</TableHead>
                        <TableHead className="dark:text-gray-300">{t("events.type")}</TableHead>
                        <TableHead className="dark:text-gray-300">{t("events.date")}</TableHead>
                        <TableHead className="dark:text-gray-300">{t("events.cost")}</TableHead>
                        <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.eventos.map((evento) => (
                        <TableRow key={evento.id} className="dark:border-gray-700">
                          <TableCell className="dark:text-gray-300">{evento.titulo}</TableCell>
                          <TableCell className="dark:text-gray-300">{getEventoTipoLabel(evento.tipo)}</TableCell>
                          <TableCell className="dark:text-gray-300">
                            {new Date(evento.data).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="dark:text-gray-300">
                            {evento.custo ? `€${evento.custo.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link href={`/module-equipament/admin/equipment/${evento.viaturaId}?tab=events`}>
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
                      <TableHead className="dark:text-gray-300">{t("events.titleField")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("events.vehicle")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("events.type")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("events.date")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("events.cost")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEventosFuturos.map((evento) => (
                      <TableRow key={evento.id} className="dark:border-gray-700">
                        <TableCell className="dark:text-gray-300">{evento.titulo}</TableCell>
                        <TableCell className="dark:text-gray-300">
                          {evento.viatura
                            ? `${evento.viatura.matricula} - ${evento.viatura.modelo}`
                            : "-"}
                        </TableCell>
                        <TableCell className="dark:text-gray-300">{getEventoTipoLabel(evento.tipo)}</TableCell>
                        <TableCell className="dark:text-gray-300">
                          {new Date(evento.data).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="dark:text-gray-300">
                          {evento.custo ? `€${evento.custo.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/module-equipament/admin/equipment/${evento.viaturaId}?tab=events`}>
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
            )}
          </div>
        </div>
      )}

      {/* Seção: Eventos Passados */}
      {filteredEventosPassados.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
            <span className="h-1 w-1 rounded-full bg-gray-500"></span>
            {t("events.past")} ({filteredEventosPassados.length})
          </h2>
          
          {/* Mobile Cards View - Passados */}
          <div className="block sm:hidden space-y-4">
            {groupByViatura && groupedEventosPassados ? (
              Object.entries(groupedEventosPassados).map(([viaturaId, group]) => (
                <div key={viaturaId} className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 rounded">
                    <h3 className="font-bold text-lg dark:text-white">
                      {group.viatura.tipo === "VEICULO" 
                      ? (group.viatura.matricula || "N/A")
                      : (group.viatura.parque || "N/A")} - {group.viatura.modelo}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {group.eventos.length} evento(s)
                    </p>
                  </div>
                  {group.eventos.map((evento) => (
                    <div key={evento.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 ml-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg dark:text-white">{evento.titulo}</h3>
                        <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{t("events.type")}: {evento.tipo}</span>
                          <span>{new Date(evento.data).toLocaleDateString("pt-BR")}</span>
                          {evento.custo && <span>€{evento.custo.toFixed(2)}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/module-equipament/admin/equipment/${evento.viaturaId}?tab=events`} className="flex-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            {t("common.edit")}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              filteredEventosPassados.map((evento) => (
                <div key={evento.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-lg dark:text-white">{evento.titulo}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {evento.viatura
                        ? `${evento.viatura.tipo === "VEICULO" 
                            ? (evento.viatura.matricula || "N/A")
                            : (evento.viatura.parque || "N/A")} - ${evento.viatura.modelo}`
                        : "-"}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                      <span>Tipo: {evento.tipo}</span>
                      <span>{new Date(evento.data).toLocaleDateString("pt-BR")}</span>
                      {evento.custo && <span>€{evento.custo.toFixed(2)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/module-equipament/admin/equipment/${evento.viaturaId}?tab=events`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table View - Passados */}
          <div className="hidden sm:block space-y-4">
            {groupByViatura && groupedEventosPassados ? (
              Object.entries(groupedEventosPassados).map(([viaturaId, group]) => (
                <div key={viaturaId} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-x-auto">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border-b p-3">
                    <h3 className="font-bold text-lg dark:text-white">
                      {group.viatura.tipo === "VEICULO" 
                      ? (group.viatura.matricula || "N/A")
                      : (group.viatura.parque || "N/A")} - {group.viatura.modelo}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {group.eventos.length} evento(s)
                    </p>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="dark:border-gray-700">
                        <TableHead className="dark:text-gray-300">{t("events.titleField")}</TableHead>
                        <TableHead className="dark:text-gray-300">{t("events.type")}</TableHead>
                        <TableHead className="dark:text-gray-300">{t("events.date")}</TableHead>
                        <TableHead className="dark:text-gray-300">{t("events.cost")}</TableHead>
                        <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {group.eventos.map((evento) => (
                        <TableRow key={evento.id} className="dark:border-gray-700">
                          <TableCell className="dark:text-gray-300">{evento.titulo}</TableCell>
                          <TableCell className="dark:text-gray-300">{getEventoTipoLabel(evento.tipo)}</TableCell>
                          <TableCell className="dark:text-gray-300">
                            {new Date(evento.data).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="dark:text-gray-300">
                            {evento.custo ? `€${evento.custo.toFixed(2)}` : "-"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Link href={`/module-equipament/admin/equipment/${evento.viaturaId}?tab=events`}>
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
                      <TableHead className="dark:text-gray-300">{t("events.titleField")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("events.vehicle")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("events.type")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("events.date")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("events.cost")}</TableHead>
                      <TableHead className="dark:text-gray-300">{t("common.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEventosPassados.map((evento) => (
                      <TableRow key={evento.id} className="dark:border-gray-700">
                        <TableCell className="dark:text-gray-300">{evento.titulo}</TableCell>
                        <TableCell className="dark:text-gray-300">
                          {evento.viatura
                            ? `${evento.viatura.matricula} - ${evento.viatura.modelo}`
                            : "-"}
                        </TableCell>
                        <TableCell className="dark:text-gray-300">{getEventoTipoLabel(evento.tipo)}</TableCell>
                        <TableCell className="dark:text-gray-300">
                          {new Date(evento.data).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="dark:text-gray-300">
                          {evento.custo ? `€${evento.custo.toFixed(2)}` : "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Link href={`/module-equipament/admin/equipment/${evento.viaturaId}?tab=events`}>
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
            )}
          </div>
        </div>
      )}

      {/* Mensagem quando não há eventos */}
      {filteredEventosFuturos.length === 0 && filteredEventosPassados.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center text-gray-500 dark:text-gray-400">
          {eventos.length === 0
            ? "Nenhum evento cadastrado"
            : "Nenhum evento encontrado com os filtros aplicados"}
        </div>
      )}
    </div>
  )
}

