import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/qrcode"
import { createAuditLog } from "@/lib/audit"

export async function GET() {
  try {
    const equipamentos = await prisma.equipamento.findMany({
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
    return NextResponse.json(equipamentos)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar equipamentos" },
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

    if (tipo === "VEICULO" && matricula) {
      const existing = await prisma.equipamento.findUnique({
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
      const existing = await prisma.equipamento.findFirst({
        where: { parque },
      })

      if (existing) {
        return NextResponse.json(
          { error: "Parque já existe" },
          { status: 400 }
        )
      }
    }

    let qrCodeDataUrl: string | null = null
    if (tipo === "VEICULO" && matricula) {
      const publicUrl = `${process.env.NEXTAUTH_URL}/equipament-view/${matricula}`
      qrCodeDataUrl = await generateQRCode(publicUrl)
    } else if (tipo === "MAQUINA" && parque) {
      const publicUrl = `${process.env.NEXTAUTH_URL}/equipament-view/${parque}`
      qrCodeDataUrl = await generateQRCode(publicUrl)
    }

    const equipamento = await prisma.equipamento.create({
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

    const user = session.user as any
    await createAuditLog(
      user.id,
      "CREATE",
      "EQUIPAMENTO",
      equipamento.id,
      `Equipamento criado: ${tipo === "VEICULO" ? matricula : parque} - ${marca} ${modelo}`,
      request
    )

    return NextResponse.json(equipamento)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao criar equipamento" },
      { status: 500 }
    )
  }
}

