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
      CREATE: "Criar",
      UPDATE: "Atualizar",
      DELETE: "Deletar",
      LOGIN: "Login",
      LOGOUT: "Logout",
    }
    return labels[acao] || acao
  }

  const getEntidadeLabel = (entidade: string) => {
    const labels: Record<string, string> = {
      VIATURA: "Equipamento",
      DOCUMENTO: "Documento",
      EVENTO: "Evento",
      USUARIO: "Usuário",
    }
    return labels[entidade] || entidade
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold dark:text-white">Auditoria do Sistema</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Registro de todas as ações realizadas no sistema
          </p>
        </div>
      </div>

      <Card className="shadow-md dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Histórico de Ações
          </CardTitle>
        </CardHeader>
        <CardContent>
          {auditoria.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum registro de auditoria encontrado
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Entidade</TableHead>
                    <TableHead>Detalhes</TableHead>
                    <TableHead>IP</TableHead>
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
                            ID: {item.entidadeId.substring(0, 8)}...
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="dark:text-gray-300 max-w-xs truncate">
                        {item.detalhes || "-"}
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

