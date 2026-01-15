import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipamentoId = searchParams.get("equipamentoId")

    const eventos = await prisma.evento.findMany({
      where: equipamentoId ? { equipamentoId } : undefined,
      select: {
        id: true,
        equipamentoId: true,
        titulo: true,
        descricao: true,
        tipo: true,
        data: true,
        custo: true,
        publico: true,
        createdAt: true,
        updatedAt: true,
        equipamento: {
          select: {
            matricula: true,
            parque: true,
            modelo: true,
            tipo: true,
          },
        },
      },
      orderBy: {
        data: "desc",
      },
      take: 500, 
    })

    return NextResponse.json(eventos)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar eventos" },
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
    const { equipamentoId, titulo, descricao, tipo, data, custo, publico } = body

    const evento = await prisma.evento.create({
      data: {
        equipamentoId,
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
      "CREATE",
      "EVENTO",
      evento.id,
      `Evento criado: ${titulo} (${tipo})`,
      request
    )

    return NextResponse.json(evento)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao criar evento" },
      { status: 500 }
    )
  }
}

