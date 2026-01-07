"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useI18n } from "@/contexts/I18nContext"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function AdminDashboard() {
  const { t } = useI18n()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    viaturas: 0,
    documentos: 0,
    eventos: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [viaturasRes, documentosRes, eventosRes] = await Promise.all([
          fetch("/api/viaturas"),
          fetch("/api/documentos"),
          fetch("/api/eventos"),
        ])

        const viaturas = await viaturasRes.json()
        const documentos = await documentosRes.json()
        const eventos = await eventosRes.json()

        setStats({
          viaturas: viaturas.length || 0,
          documentos: documentos.length || 0,
          eventos: eventos.length || 0,
        })
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  if (loading) return <LoadingSpinner />

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 dark:text-white">
        {t("dashboard.title")}
      </h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("dashboard.vehicles")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-white">{stats.viaturas}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("dashboard.documents")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-white">{stats.documentos}</p>
          </CardContent>
        </Card>
        <Card className="dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="dark:text-white">{t("dashboard.events")}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold dark:text-white">{stats.eventos}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

