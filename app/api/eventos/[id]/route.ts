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
    const evento = await prisma.evento.findUnique({
      where: { id: params.id },
      include: {
        equipamento: true,
      },
    })

    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(evento)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar evento" },
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
    const { titulo, descricao, tipo, data, custo, publico } = body

    const evento = await prisma.evento.update({
      where: { id: params.id },
      data: {
        titulo,
        descricao,
        tipo,
        data: new Date(data),
        custo: custo ? parseFloat(custo) : null,
        publico: publico !== undefined ? publico : false,
      },
    })

    const user = session.user as any
    await createAuditLog(
      user.id,
      "UPDATE",
      "EVENTO",
      evento.id,
      `Evento atualizado: ${titulo}`,
      request
    )

    return NextResponse.json(evento)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao atualizar evento" },
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

    const evento = await prisma.evento.findUnique({
      where: { id: params.id },
    })

    if (!evento) {
      return NextResponse.json(
        { error: "Evento não encontrado" },
        { status: 404 }
      )
    }

    await prisma.evento.delete({
      where: { id: params.id },
    })

    const user = session.user as any
    await createAuditLog(
      user.id,
      "DELETE",
      "EVENTO",
      params.id,
      `Evento deletado: ${evento.titulo}`,
      request
    )

    return NextResponse.json({ message: "Evento deletado com sucesso" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao deletar evento" },
      { status: 500 }
    )
  }
}

