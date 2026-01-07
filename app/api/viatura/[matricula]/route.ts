import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { matricula: string } }
) {
  try {
    const viatura = await prisma.viatura.findUnique({
      where: { matricula: params.matricula },
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

