"use client"

import { useEffect, useState, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import { format } from "date-fns"
import { FileText, Calendar, User, Settings, Trash2, Plus, Edit, LogIn, LogOut } from "lucide-react"
import { useI18n } from "@/contexts/I18nContext"

interface AuditoriaItem {
  id: string
  acao: string
  entidade: string
  entidadeId?: string
  detalhes?: string
  ipAddress?: string
  userAgent?: string
  createdAt: string
  user: {
    id: string
    name?: string
    email: string
  }
}

export default function AuditoriaPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { t } = useI18n()
  const [auditoria, setAuditoria] = useState<AuditoriaItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session && (session.user as any)?.role !== "ADMIN") {
      router.push("/module-equipament/admin")
      return
    }
  }, [session, router])

  const fetchAuditoria = useCallback(async () => {
    try {
      const res = await fetch("/api/auditoria")
      if (res.ok) {
        const data = await res.json()
        setAuditoria(data)
      }
    } catch (error) {
      console.error("Erro ao buscar auditoria:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAuditoria()
  }, [fetchAuditoria])

  const getAcaoIcon = (acao: string) => {
    switch (acao) {
      case "CREATE":
        return <Plus className="h-4 w-4 text-green-500" />
      case "UPDATE":
        return <Edit className="h-4 w-4 text-blue-500" />
      case "DELETE":
        return <Trash2 className="h-4 w-4 text-red-500" />
      case "LOGIN":
        return <LogIn className="h-4 w-4 text-green-500" />
      case "LOGOUT":
        return <LogOut className="h-4 w-4 text-gray-500" />
      default:
        return <Settings className="h-4 w-4 text-gray-500" />
    }
  }

  const getAcaoLabel = (acao: string) => {
    const labels: Record<string, string> = {
      CREATE: t("audit.actions.create"),
      UPDATE: t("audit.actions.update"),
      DELETE: t("audit.actions.delete"),
      LOGIN: t("audit.actions.login"),
      LOGOUT: t("audit.actions.logout"),
    }
    return labels[acao] || acao
  }

  const getEntidadeLabel = (entidade: string) => {
    const labels: Record<string, string> = {
      VIATURA: t("audit.entities.equipment"),
      EQUIPAMENTO: t("audit.entities.equipment"),
      DOCUMENTO: t("audit.entities.document"),
      EVENTO: t("audit.entities.event"),
      USUARIO: t("audit.entities.user"),
    }
    return labels[entidade] || entidade
  }

  const getTranslatedDetails = (detalhes: string | null | undefined, acao: string, entidade: string): string => {
    if (!detalhes) return "-"

    const patterns: Record<string, { pattern: RegExp; key: string }> = {
      "EQUIPAMENTO_CREATE": {
        pattern: /^Equipamento criado: (.+)$/,
        key: "audit.details.equipmentCreated"
      },
      "EQUIPAMENTO_UPDATE": {
        pattern: /^Equipamento atualizado: (.+)$/,
        key: "audit.details.equipmentUpdated"
      },
      "EQUIPAMENTO_DELETE": {
        pattern: /^Equipamento deletado: (.+)$/,
        key: "audit.details.equipmentDeleted"
      },
      "EQUIPAMENTO_VISIBILITY": {
        pattern: /^Visibilidade pública atualizada$/,
        key: "audit.details.visibilityUpdated"
      },
      "DOCUMENTO_CREATE": {
        pattern: /^Documento criado: (.+)$/,
        key: "audit.details.documentCreated"
      },
      "DOCUMENTO_UPDATE": {
        pattern: /^Documento atualizado: (.+)$/,
        key: "audit.details.documentUpdated"
      },
      "DOCUMENTO_DELETE": {
        pattern: /^Documento deletado: (.+)$/,
        key: "audit.details.documentDeleted"
      },
      "EVENTO_CREATE": {
        pattern: /^Evento criado: (.+)$/,
        key: "audit.details.eventCreated"
      },
      "EVENTO_UPDATE": {
        pattern: /^Evento atualizado: (.+)$/,
        key: "audit.details.eventUpdated"
      },
      "EVENTO_DELETE": {
        pattern: /^Evento deletado: (.+)$/,
        key: "audit.details.eventDeleted"
      },
      "USUARIO_CREATE": {
        pattern: /^Usuário criado: (.+)$/,
        key: "audit.details.userCreated"
      },
      "USUARIO_UPDATE": {
        pattern: /^Usuário atualizado: (.+)$/,
        key: "audit.details.userUpdated"
      },
      "USUARIO_DELETE": {
        pattern: /^Usuário deletado: (.+)$/,
        key: "audit.details.userDeleted"
      },
      "USUARIO_LOGIN": {
        pattern: /^Login realizado: (.+)$/,
        key: "audit.details.login"
      },
    }

    if (detalhes === "Visibilidade pública atualizada") {
      return t("audit.details.visibilityUpdated")
    }

    const key = `${entidade}_${acao}`
    const config = patterns[key]

    if (config) {
      const match = detalhes.match(config.pattern)
      if (match) {
        if (match[1]) {
          return t(config.key).replace("{details}", match[1])
        } else {
          return t(config.key)
        }
      }
    }

    return detalhes
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">{t("audit.title")}</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t("audit.description")}
          </p>
        </div>
      </div>

      <Card className="shadow-md dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("audit.history")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditoria.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                {t("audit.noRecords")}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("audit.dateTime")}</TableHead>
                    <TableHead>{t("audit.user")}</TableHead>
                    <TableHead>{t("audit.action")}</TableHead>
                    <TableHead>{t("audit.entity")}</TableHead>
                    <TableHead>{t("audit.details")}</TableHead>
                    <TableHead>{t("audit.ip")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditoria.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {format(new Date(item.createdAt), "dd/MM/yyyy HH:mm:ss")}
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">
                              {item.user.name || item.user.email}
                            </div>
                            {item.user.name && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">
                                {item.user.email}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        <div className="flex items-center gap-2">
                          {getAcaoIcon(item.acao)}
                          <span>{getAcaoLabel(item.acao)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="dark:text-gray-300">
                        {getEntidadeLabel(item.entidade)}
                        {item.entidadeId && (
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {t("audit.id")}: {item.entidadeId.substring(0, 8)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="dark:text-gray-300 max-w-xs truncate">
                        {getTranslatedDetails(item.detalhes, item.acao, item.entidade)}
                      </TableCell>
                      <TableCell className="dark:text-gray-300 text-xs">
                        {item.ipAddress || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

