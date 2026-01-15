import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documento = await prisma.documento.findUnique({
      where: { id: params.id },
      include: {
        equipamento: true,
      },
    })

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(documento)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar documento" },
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
    const { titulo, descricao, arquivo, tipo, dataVencimento, publico } = body

    const documento = await prisma.documento.update({
      where: { id: params.id },
      data: {
        titulo,
        descricao,
        arquivo,
        tipo,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        publico: publico !== undefined ? publico : false,
      },
    })

    const user = session.user as any
    await createAuditLog(
      user.id,
      "UPDATE",
      "DOCUMENTO",
      documento.id,
      `Documento atualizado: ${titulo}`,
      request
    )

    return NextResponse.json(documento)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao atualizar documento" },
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

    const documento = await prisma.documento.findUnique({
      where: { id: params.id },
    })

    if (!documento) {
      return NextResponse.json(
        { error: "Documento não encontrado" },
        { status: 404 }
      )
    }

    await prisma.documento.delete({
      where: { id: params.id },
    })

    const user = session.user as any
    await createAuditLog(
      user.id,
      "DELETE",
      "DOCUMENTO",
      params.id,
      `Documento deletado: ${documento.titulo}`,
      request
    )

    return NextResponse.json({ message: "Documento deletado com sucesso" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao deletar documento" },
      { status: 500 }
    )
  }
}

