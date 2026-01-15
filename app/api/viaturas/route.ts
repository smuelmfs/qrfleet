import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/qrcode"

export async function GET() {
  try {
    // Buscar apenas campos necessários para listagem (sem documentos e eventos)
    const viaturas = await prisma.viatura.findMany({
      select: {
        id: true,
        tipo: true,
        matricula: true,
        parque: true,
        peso: true,
        modelo: true,
        marca: true,
        ano: true,
        foto: true,
        descricao: true,
        qrCode: true,
        createdAt: true,
        updatedAt: true,
        // Contar documentos e eventos ao invés de buscar todos
        _count: {
          select: {
            documentos: true,
            eventos: true,
          },
        },
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
    const { tipo, matricula, parque, peso, modelo, marca, ano, foto, descricao } = body

    // Validar tipo
    if (tipo === "VEICULO" && !matricula) {
      return NextResponse.json(
        { error: "Matrícula é obrigatória para veículos" },
        { status: 400 }
      )
    }

    if (tipo === "MAQUINA" && !parque) {
      return NextResponse.json(
        { error: "Parque é obrigatório para máquinas" },
        { status: 400 }
      )
    }

    // Verificar se a matrícula ou parque já existe
    if (tipo === "VEICULO" && matricula) {
      const existing = await prisma.viatura.findUnique({
        where: { matricula },
      })

      if (existing) {
        return NextResponse.json(
          { error: "Matrícula já existe" },
          { status: 400 }
        )
      }
    }

    if (tipo === "MAQUINA" && parque) {
      const existing = await prisma.viatura.findFirst({
        where: { parque },
      })

      if (existing) {
        return NextResponse.json(
          { error: "Parque já existe" },
          { status: 400 }
        )
      }
    }

    // Gerar QR Code para veículos e máquinas
    let qrCodeDataUrl: string | null = null
    if (tipo === "VEICULO" && matricula) {
      const publicUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/equipament-view/${matricula}`
      qrCodeDataUrl = await generateQRCode(publicUrl)
    } else if (tipo === "MAQUINA" && parque) {
      const publicUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/equipament-view/${parque}`
      qrCodeDataUrl = await generateQRCode(publicUrl)
    }

    const viatura = await prisma.viatura.create({
      data: {
        tipo: tipo || "VEICULO",
        matricula: tipo === "VEICULO" ? matricula : null,
        parque: tipo === "MAQUINA" ? parque : null,
        peso: tipo === "MAQUINA" ? peso || null : null,
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

