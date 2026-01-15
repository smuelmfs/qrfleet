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
          take: 100, // Limitar a 100 documentos mais recentes
        },
        eventos: {
          orderBy: { data: "desc" },
          take: 100, // Limitar a 100 eventos mais recentes
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
    const { 
      tipo, 
      matricula, 
      parque, 
      peso,
      modelo, 
      marca, 
      ano, 
      foto, 
      descricao,
      publicoFoto,
      publicoDescricao,
      publicoMarca,
      publicoModelo,
      publicoAno
    } = body

    // Verificar se é apenas atualização de visibilidade
    const isOnlyVisibilityUpdate = 
      tipo === undefined && 
      matricula === undefined && 
      parque === undefined && 
      modelo === undefined && 
      marca === undefined && 
      ano === undefined && 
      foto === undefined && 
      descricao === undefined

    const updateData: any = {}

    // Se não for apenas atualização de visibilidade, processar campos normais
    if (!isOnlyVisibilityUpdate) {
      // Validar tipo
      if (tipo === "VEICULO" && !matricula) {
        return NextResponse.json(
          { error: "Matrícula é obrigatória para veículos" },
          { status: 400 }
        )
      }

      if (tipo === "MAQUINA" && !parque) {
        return NextResponse.json(
          { error: "Parque é obrigatório para máquinas" },
          { status: 400 }
        )
      }

      // Verificar se a matrícula ou parque já existe (se mudou)
      if (tipo === "VEICULO" && matricula) {
        const existing = await prisma.viatura.findUnique({
          where: { matricula },
        })

        if (existing && existing.id !== params.id) {
          return NextResponse.json(
            { error: "Matrícula já existe" },
            { status: 400 }
          )
        }
      }

      if (tipo === "MAQUINA" && parque) {
        const existing = await prisma.viatura.findFirst({
          where: { parque },
        })

        if (existing && existing.id !== params.id) {
          return NextResponse.json(
            { error: "Parque já existe" },
            { status: 400 }
          )
        }
      }

      // Gerar QR Code para veículos e máquinas
      let qrCodeDataUrl: string | null = null
      if (tipo === "VEICULO" && matricula) {
        const publicUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/equipament-view/${matricula}`
        qrCodeDataUrl = await generateQRCode(publicUrl)
      } else if (tipo === "MAQUINA" && parque) {
        const publicUrl = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/equipament-view/${parque}`
        qrCodeDataUrl = await generateQRCode(publicUrl)
      }

      // Adicionar campos apenas se fornecidos
      if (tipo !== undefined) updateData.tipo = tipo
      if (tipo !== undefined) {
        updateData.matricula = tipo === "VEICULO" ? matricula : null
        updateData.parque = tipo === "MAQUINA" ? parque : null
        updateData.peso = tipo === "MAQUINA" ? peso || null : null
      } else {
        if (matricula !== undefined) updateData.matricula = matricula
        if (parque !== undefined) updateData.parque = parque
        if (peso !== undefined) updateData.peso = peso || null
      }
      if (modelo !== undefined) updateData.modelo = modelo
      if (marca !== undefined) updateData.marca = marca
      if (ano !== undefined) updateData.ano = parseInt(ano.toString())
      if (foto !== undefined) updateData.foto = foto
      if (descricao !== undefined) updateData.descricao = descricao
      if (qrCodeDataUrl !== null) updateData.qrCode = qrCodeDataUrl
    }

    // Adicionar campos de visibilidade se fornecidos
    if (publicoFoto !== undefined) updateData.publicoFoto = publicoFoto
    if (publicoDescricao !== undefined) updateData.publicoDescricao = publicoDescricao
    if (publicoMarca !== undefined) updateData.publicoMarca = publicoMarca
    if (publicoModelo !== undefined) updateData.publicoModelo = publicoModelo
    if (publicoAno !== undefined) updateData.publicoAno = publicoAno

    const viatura = await prisma.viatura.update({
      where: { id: params.id },
      data: updateData,
    })

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

