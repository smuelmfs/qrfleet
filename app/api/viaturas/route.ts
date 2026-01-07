import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/qrcode"

export async function GET() {
  try {
    const viaturas = await prisma.viatura.findMany({
      include: {
        documentos: true,
        eventos: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })
    return NextResponse.json(viaturas)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar viaturas" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { matricula, modelo, marca, ano, foto, descricao } = body

    // Verificar se a matrícula já existe
    const existing = await prisma.viatura.findUnique({
      where: { matricula },
    })

    if (existing) {
      return NextResponse.json(
        { error: "Matrícula já existe" },
        { status: 400 }
      )
    }

    // Gerar URL pública da viatura (fixo para domínio atual)
    const publicUrl = `http://localhost:3000/viatura/${matricula}`
    
    // Gerar QR Code
    const qrCodeDataUrl = await generateQRCode(publicUrl)

    const viatura = await prisma.viatura.create({
      data: {
        matricula,
        modelo,
        marca,
        ano: parseInt(ano),
        foto,
        descricao,
        qrCode: qrCodeDataUrl,
      },
    })

    return NextResponse.json(viatura)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao criar viatura" },
      { status: 500 }
    )
  }
}

