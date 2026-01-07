import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/qrcode"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const viatura = await prisma.viatura.findUnique({
      where: { id: params.id },
      include: {
        documentos: {
          orderBy: { createdAt: "desc" },
        },
        eventos: {
          orderBy: { data: "desc" },
        },
      },
    })

    if (!viatura) {
      return NextResponse.json(
        { error: "Viatura não encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json(viatura)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar viatura" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { matricula, modelo, marca, ano, foto, descricao } = body

    const viatura = await prisma.viatura.update({
      where: { id: params.id },
      data: {
        matricula,
        modelo,
        marca,
        ano: parseInt(ano),
        foto,
        descricao,
      },
    })

    // Regenerar QR Code se necessário
    if (matricula) {
      const publicUrl = `http://localhost:3000/viatura/${matricula}`
      const qrCodeDataUrl = await generateQRCode(publicUrl)
      await prisma.viatura.update({
        where: { id: params.id },
        data: { qrCode: qrCodeDataUrl },
      })
    }

    return NextResponse.json(viatura)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao atualizar viatura" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const viatura = await prisma.viatura.findUnique({
      where: { id: params.id },
    })

    if (!viatura) {
      return NextResponse.json(
        { error: "Viatura não encontrada" },
        { status: 404 }
      )
    }

    await prisma.viatura.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Viatura deletada com sucesso" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao deletar viatura" },
      { status: 500 }
    )
  }
}

