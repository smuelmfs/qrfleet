import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { matricula: string } }
) {
  try {
    // Tentar buscar por matrícula primeiro
    let viatura = await prisma.viatura.findUnique({
      where: { matricula: params.matricula },
      include: {
        documentos: {
          where: { publico: true },
          orderBy: { createdAt: "desc" },
        },
        eventos: {
          where: { publico: true },
          orderBy: { data: "desc" },
        },
      },
    })

    // Se não encontrar por matrícula, tentar por parque
    if (!viatura) {
      viatura = await prisma.viatura.findFirst({
        where: { parque: params.matricula },
        include: {
          documentos: {
            where: { publico: true },
            orderBy: { createdAt: "desc" },
          },
          eventos: {
            where: { publico: true },
            orderBy: { data: "desc" },
          },
        },
      })
    }

    if (!viatura) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    // Filtrar apenas informações públicas
    const viaturaPublica = {
      id: viatura.id,
      tipo: viatura.tipo,
      matricula: viatura.matricula,
      parque: viatura.parque,
      modelo: viatura.publicoModelo ? viatura.modelo : undefined,
      marca: viatura.publicoMarca ? viatura.marca : undefined,
      ano: viatura.publicoAno ? viatura.ano : undefined,
      foto: viatura.publicoFoto ? viatura.foto : undefined,
      descricao: viatura.publicoDescricao ? viatura.descricao : undefined,
      documentos: viatura.documentos.map((doc) => ({
        id: doc.id,
        titulo: doc.titulo,
        descricao: doc.descricao,
        arquivo: doc.arquivo,
        tipo: doc.tipo,
        dataVencimento: doc.dataVencimento,
      })),
      eventos: viatura.eventos.map((evento) => ({
        id: evento.id,
        titulo: evento.titulo,
        descricao: evento.descricao,
        tipo: evento.tipo,
        data: evento.data,
        custo: evento.custo,
      })),
    }

    return NextResponse.json(viaturaPublica)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar equipamento" },
      { status: 500 }
    )
  }
}

