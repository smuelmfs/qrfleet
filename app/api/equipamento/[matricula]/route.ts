import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: NextRequest,
  { params }: { params: { matricula: string } }
) {
  try {
    let equipamento = await prisma.equipamento.findUnique({
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

    if (!equipamento) {
      equipamento = await prisma.equipamento.findFirst({
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

    if (!equipamento) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    const equipamentoPublico = {
      id: equipamento.id,
      tipo: equipamento.tipo,
      matricula: equipamento.matricula,
      parque: equipamento.parque,
      modelo: equipamento.publicoModelo ? equipamento.modelo : undefined,
      marca: equipamento.publicoMarca ? equipamento.marca : undefined,
      ano: equipamento.publicoAno ? equipamento.ano : undefined,
      foto: equipamento.publicoFoto ? equipamento.foto : undefined,
      descricao: equipamento.publicoDescricao ? equipamento.descricao : undefined,
      documentos: equipamento.documentos.map((doc) => ({
        id: doc.id,
        titulo: doc.titulo,
        descricao: doc.descricao,
        arquivo: doc.arquivo,
        tipo: doc.tipo,
        dataVencimento: doc.dataVencimento,
      })),
      eventos: equipamento.eventos.map((evento) => ({
        id: evento.id,
        titulo: evento.titulo,
        descricao: evento.descricao,
        tipo: evento.tipo,
        data: evento.data,
        custo: evento.custo,
      })),
    }

    return NextResponse.json(equipamentoPublico)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar equipamento" },
      { status: 500 }
    )
  }
}

