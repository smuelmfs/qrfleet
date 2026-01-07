import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const viaturaId = searchParams.get("viaturaId")

    const documentos = await prisma.documento.findMany({
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
        createdAt: "desc",
      },
    })

    return NextResponse.json(documentos)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar documentos" },
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
    const { viaturaId, titulo, descricao, arquivo, tipo, dataVencimento } = body

    const documento = await prisma.documento.create({
      data: {
        viaturaId,
        titulo,
        descricao,
        arquivo,
        tipo,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
      },
    })

    return NextResponse.json(documento)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao criar documento" },
      { status: 500 }
    )
  }
}

