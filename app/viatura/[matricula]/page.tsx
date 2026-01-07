"use client"

import { useEffect, useState, useCallback } from "react"
import Image from "next/image"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Calendar, FileText, Wrench, Eye, EyeOff, Fuel, Settings, CheckCircle } from "lucide-react"
import { format } from "date-fns"
import { useI18n } from "@/contexts/I18nContext"
import { ThemeToggle } from "@/components/ThemeToggle"
import { LanguageToggle } from "@/components/LanguageToggle"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface Documento {
  id: string
  titulo: string
  descricao?: string
  arquivo: string
  tipo: string
  dataVencimento?: string
}

interface Evento {
  id: string
  titulo: string
  descricao?: string
  tipo: string
  data: string
  custo?: number
}

interface Viatura {
  id: string
  matricula: string
  modelo: string
  marca: string
  ano: number
  foto?: string
  descricao?: string
  documentos: Documento[]
  eventos: Evento[]
}

export default function ViaturaPublicPage({
  params,
}: {
  params: { matricula: string }
}) {
  const [viatura, setViatura] = useState<Viatura | null>(null)
  const [loading, setLoading] = useState(true)
  const [showImage, setShowImage] = useState(false)
  const { t } = useI18n()

  const fetchViatura = useCallback(async () => {
    try {
      const res = await fetch(`/api/viatura/${params.matricula}`)
      if (res.ok) {
        const data = await res.json()
        setViatura(data)
      } else {
        setViatura(null)
      }
    } catch (error) {
      console.error("Erro ao buscar viatura:", error)
      setViatura(null)
    } finally {
      setLoading(false)
    }
  }, [params.matricula])

  useEffect(() => {
    fetchViatura()
  }, [fetchViatura])

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
  
  const getEventoIcon = (tipo: string) => {
    switch (tipo) {
      case "COMBUSTIVEL":
        return <Fuel className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      case "MANUTENCAO":
      case "REPARACAO":
        return <Wrench className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      case "PECAS_TROCADAS":
        return <Settings className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      case "INSPECAO":
      case "REVISAO":
        return <CheckCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
      default:
        return <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!viatura) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 dark:text-white">{t("public.vehicleNotFound")}</h1>
          <p className="dark:text-gray-400">{t("public.vehicleNotFound")} - {params.matricula}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navbar */}
      <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold dark:text-white">QRFleet</h2>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <LanguageToggle />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold dark:text-white">
                {viatura.marca} {viatura.modelo}
              </h1>
              {viatura.foto && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowImage(!showImage)}
                  className="ml-4"
                  aria-label={showImage ? t("public.hideImage") : t("public.showImage")}
                >
                  {showImage ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              )}
            </div>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
              {t("public.license")}: {viatura.matricula}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              {t("public.year")}: {viatura.ano}
            </p>
            {viatura.descricao && (
              <p className="text-gray-700 dark:text-gray-300 mt-4">{viatura.descricao}</p>
            )}
          </div>
          {viatura.foto && showImage && (
            <div className="relative w-full h-64 md:h-96 border-t dark:border-gray-700">
              <Image
                src={viatura.foto}
                alt={`${viatura.marca} ${viatura.modelo}`}
                fill
                className="object-cover"
              />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-2">
                <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {t("public.documents")}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                {t("public.documentsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viatura.documentos.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  {t("documents.noDocuments")}
                </p>
              ) : (
                <div className="space-y-3">
                  {viatura.documentos.map((documento) => (
                    <div
                      key={documento.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors bg-white dark:bg-gray-800"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base text-gray-900 dark:text-white mb-2">{documento.titulo}</h3>
                          {documento.descricao && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
                              {documento.descricao}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <span>
                              <span className="font-medium text-gray-700 dark:text-gray-300">{t("public.type")}: </span>
                              {documento.tipo}
                            </span>
                            {documento.dataVencimento && (
                              <span>
                                <span className="font-medium text-gray-700 dark:text-gray-300">{t("public.expiration")}: </span>
                                {format(
                                  new Date(documento.dataVencimento),
                                  "dd/MM/yyyy"
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(documento.arquivo, "_blank")}
                          className="flex-shrink-0"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {t("common.download")}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
              <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white mb-2">
                <Wrench className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                {t("events.history")}
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400 text-sm">
                {t("public.eventsDesc")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {viatura.eventos.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  {t("events.noEvents")}
                </p>
              ) : (
                <div className="space-y-6">
                  {/* Eventos Futuros */}
                  {(() => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const eventosFuturos = viatura.eventos.filter((evento) => {
                      const eventDate = new Date(evento.data)
                      eventDate.setHours(0, 0, 0, 0)
                      return eventDate >= today
                    }).sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())

                    if (eventosFuturos.length > 0) {
                      return (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-600 dark:bg-gray-400"></span>
                            {t("events.future")} ({eventosFuturos.length})
                          </h3>
                          <div className="space-y-3">
                            {eventosFuturos.map((evento) => (
                              <div
                                key={evento.id}
                                className="border-l-4 border-gray-400 dark:border-gray-500 pl-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      {getEventoIcon(evento.tipo)}
                                      <h3 className="font-semibold text-base text-gray-900 dark:text-white">{evento.titulo}</h3>
                                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                        {getEventoTipoLabel(evento.tipo)}
                                      </span>
                                    </div>
                                    {evento.descricao && (
                                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 leading-relaxed">
                                        {evento.descricao}
                                      </p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(new Date(evento.data), "dd/MM/yyyy")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Eventos Passados */}
                  {(() => {
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const eventosPassados = viatura.eventos.filter((evento) => {
                      const eventDate = new Date(evento.data)
                      eventDate.setHours(0, 0, 0, 0)
                      return eventDate < today
                    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

                    if (eventosPassados.length > 0) {
                      return (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-gray-500"></span>
                            {t("events.past")} ({eventosPassados.length})
                          </h3>
                          <div className="space-y-3">
                            {eventosPassados.map((evento) => (
                              <div
                                key={evento.id}
                                className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 opacity-80"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                      {getEventoIcon(evento.tipo)}
                                      <h3 className="font-semibold text-base text-gray-800 dark:text-gray-300">{evento.titulo}</h3>
                                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                        {getEventoTipoLabel(evento.tipo)}
                                      </span>
                                    </div>
                                    {evento.descricao && (
                                      <p className="text-sm text-gray-600 dark:text-gray-500 mb-2 leading-relaxed">
                                        {evento.descricao}
                                      </p>
                                    )}
                                    <div className="flex gap-4 mt-2 text-sm text-gray-500 dark:text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3.5 w-3.5" />
                                        {format(new Date(evento.data), "dd/MM/yyyy")}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

