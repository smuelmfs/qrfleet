import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { createAuditLog } from "@/lib/audit"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const equipamentoId = searchParams.get("equipamentoId")

    const documentos = await prisma.documento.findMany({
      where: equipamentoId ? { equipamentoId } : undefined,
      select: {
        id: true,
        equipamentoId: true,
        titulo: true,
        descricao: true,
        arquivo: true,
        tipo: true,
        dataVencimento: true,
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
        createdAt: "desc",
      },
      take: 500, 
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
    const { equipamentoId, titulo, descricao, arquivo, tipo, dataVencimento, publico } = body

    const documento = await prisma.documento.create({
      data: {
        equipamentoId,
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
      "CREATE",
      "DOCUMENTO",
      documento.id,
      `Documento criado: ${titulo} (${tipo})`,
      request
    )

    return NextResponse.json(documento)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao criar documento" },
      { status: 500 }
    )
  }
}

