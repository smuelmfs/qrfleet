import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const viaturaId = searchParams.get("viaturaId")

    const eventos = await prisma.evento.findMany({
      where: viaturaId ? { viaturaId } : undefined,
      include: {
        viatura: {
          select: {
            matricula: true,
            modelo: true,
          },
        },
      },
      orderBy: {
        data: "desc",
      },
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
    const { viaturaId, titulo, descricao, tipo, data, custo } = body

    const evento = await prisma.evento.create({
      data: {
        viaturaId,
        titulo,
        descricao,
        tipo,
        data: new Date(data),
        custo: custo ? parseFloat(custo) : null,
      },
    })

    return NextResponse.json(evento)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao criar evento" },
      { status: 500 }
    )
  }
}

