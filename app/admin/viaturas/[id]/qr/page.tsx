"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function QRCodePage() {
  const params = useParams()
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [matricula, setMatricula] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchViatura()
  }, [params.id])

  const fetchViatura = async () => {
    try {
      const res = await fetch(`/api/viaturas/${params.id}`)
      if (res.ok) {
        const data = await res.json()
        setQrCode(data.qrCode)
        setMatricula(data.matricula)
      }
    } catch (error) {
      console.error("Erro ao buscar viatura:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrCode) return

    const link = document.createElement("a")
    link.href = qrCode
    link.download = `qr-code-${matricula}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!qrCode) {
    return <div>QR Code não encontrado</div>
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>QR Code - {matricula}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="relative w-64 h-64">
            <Image
              src={qrCode}
              alt={`QR Code para ${matricula}`}
              fill
              className="object-contain"
            />
          </div>
          <Button onClick={handleDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download QR Code
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

