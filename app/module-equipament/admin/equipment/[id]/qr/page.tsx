"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, ArrowLeft } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"
import jsPDF from "jspdf"

export default function QRCodePage() {
  const params = useParams()
  const router = useRouter()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [equipamento, setEquipamento] = useState<{
    tipo: string
    matricula?: string
    parque?: string
    marca: string
    modelo: string
  } | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchViatura = useCallback(async () => {
    try {
      const res = await fetch(`/api/viaturas/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setQrCode(data.qrCode)
        setEquipamento({
          tipo: data.tipo,
          matricula: data.matricula,
          parque: data.parque,
          marca: data.marca,
          modelo: data.modelo,
        })
      }
    } catch (error) {
      console.error("Erro ao buscar equipamento:", error)
    } finally {
      setLoading(false)
    }
  }, [params.id])

  useEffect(() => {
    fetchViatura()
  }, [fetchViatura])

  const handleDownload = () => {
    if (!qrCode || !equipamento) return

    const identificador = equipamento.tipo === "VEICULO" 
      ? equipamento.matricula 
      : equipamento.parque

    const label = equipamento.tipo === "VEICULO" 
      ? "Matrícula" 
      : "Parque"

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
      const qrY = (pageHeight - qrSize) / 2 - 20 // Centralizar verticalmente com espaço para texto

      // Adicionar QR Code
      pdf.addImage(qrCode, "PNG", qrX, qrY, qrSize, qrSize)

      // Adicionar informação do identificador abaixo do QR code
      const textY = qrY + qrSize + 15
      pdf.setFontSize(16)
      pdf.setFont("helvetica", "bold")
      pdf.text(`${label}: ${identificador}`, pageWidth / 2, textY, {
        align: "center",
      })

      // Salvar PDF
      pdf.save(`QRCode-${identificador}.pdf`)
    } catch (error) {
      console.error("Erro ao gerar PDF:", error)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!qrCode || !equipamento) {
    return (
      <div className="max-w-md mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            QR Code não encontrado
          </p>
          <Link href={`/module-equipament/admin/equipment/${params.id}`}>
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const identificador = equipamento.tipo === "VEICULO" 
    ? equipamento.matricula 
    : equipamento.parque

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-md mx-auto space-y-4">
        <Link href={`/module-equipament/admin/equipment/${params.id}`}>
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </Link>

        <Card className="shadow-lg dark:bg-gray-800">
          <CardHeader>
            <CardTitle className="text-center">
              QR Code
            </CardTitle>
            <div className="text-center mt-2">
              <p className="text-lg font-semibold dark:text-white">
                {equipamento.marca} {equipamento.modelo}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {equipamento.tipo === "VEICULO" 
                  ? `Matrícula: ${equipamento.matricula}`
                  : `Parque: ${equipamento.parque}`}
              </p>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-6">
            <div className="relative w-64 h-64 bg-white p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700">
              <Image
                src={qrCode}
                alt={`QR Code para ${identificador}`}
                fill
                className="object-contain p-2"
              />
            </div>
            <Button onClick={handleDownload} size="lg" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download QR Code
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

