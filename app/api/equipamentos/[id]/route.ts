import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/qrcode"
import { createAuditLog } from "@/lib/audit"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const equipamento = await prisma.equipamento.findUnique({
      where: { id: params.id },
      include: {
        documentos: {
          orderBy: { createdAt: "desc" },
          take: 100,
        },
        eventos: {
          orderBy: { data: "desc" },
          take: 100,
        },
      },
    })

    if (!equipamento) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(equipamento)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar equipamento" },
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

    if (!isOnlyVisibilityUpdate) {
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

      if (tipo === "VEICULO" && matricula) {
        const existing = await prisma.equipamento.findUnique({
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
        const existing = await prisma.equipamento.findFirst({
          where: { parque },
        })

        if (existing && existing.id !== params.id) {
          return NextResponse.json(
            { error: "Parque já existe" },
            { status: 400 }
          )
        }
      }

      let qrCodeDataUrl: string | null = null
      if (tipo === "VEICULO" && matricula) {
        const publicUrl = `${process.env.NEXTAUTH_URL}/equipament-view/${matricula}`
        qrCodeDataUrl = await generateQRCode(publicUrl)
      } else if (tipo === "MAQUINA" && parque) {
        const publicUrl = `${process.env.NEXTAUTH_URL}/equipament-view/${parque}`
        qrCodeDataUrl = await generateQRCode(publicUrl)
      }

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

    if (publicoFoto !== undefined) updateData.publicoFoto = publicoFoto
    if (publicoDescricao !== undefined) updateData.publicoDescricao = publicoDescricao
    if (publicoMarca !== undefined) updateData.publicoMarca = publicoMarca
    if (publicoModelo !== undefined) updateData.publicoModelo = publicoModelo
    if (publicoAno !== undefined) updateData.publicoAno = publicoAno

    const equipamento = await prisma.equipamento.update({
      where: { id: params.id },
      data: updateData,
    })

    const user = session.user as any
    const detalhes = isOnlyVisibilityUpdate
      ? "Visibilidade pública atualizada"
      : `Equipamento atualizado: ${equipamento.matricula || equipamento.parque} - ${equipamento.marca} ${equipamento.modelo}`
    
    await createAuditLog(
      user.id,
      "UPDATE",
      "EQUIPAMENTO",
      equipamento.id,
      detalhes,
      request
    )

    return NextResponse.json(equipamento)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao atualizar equipamento" },
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

    const equipamento = await prisma.equipamento.findUnique({
      where: { id: params.id },
    })

    if (!equipamento) {
      return NextResponse.json(
        { error: "Equipamento não encontrado" },
        { status: 404 }
      )
    }

    const identificacao = equipamento.matricula || equipamento.parque || equipamento.id
    
    await prisma.equipamento.delete({
      where: { id: params.id },
    })

    const user = session.user as any
    await createAuditLog(
      user.id,
      "DELETE",
      "EQUIPAMENTO",
      params.id,
      `Equipamento deletado: ${identificacao} - ${equipamento.marca} ${equipamento.modelo}`,
      request
    )

    return NextResponse.json({ message: "Equipamento deletado com sucesso" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao deletar equipamento" },
      { status: 500 }
    )
  }
}

