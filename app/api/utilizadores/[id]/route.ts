import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const utilizador = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!utilizador) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(utilizador)
  } catch (error) {
    return NextResponse.json(
      { error: "Erro ao buscar utilizador" },
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

    const user = session.user as any
    if (user.role !== "ADMIN" && user.id !== params.id) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { name, email, password, role } = body

    // Montar dados de atualização apenas com campos enviados
    const updateData: any = {}

    if (typeof name === "string" && name.trim() !== "") {
      updateData.name = name.trim()
    }

    if (typeof email === "string" && email.trim() !== "") {
      updateData.email = email.trim()
    }

    if (user.role === "ADMIN" && role) {
      updateData.role = role
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const utilizador = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(utilizador)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao atualizar utilizador" },
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

    const user = session.user as any
    if (user.role !== "ADMIN") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    if (user.id === params.id) {
      return NextResponse.json(
        { error: "Não é possível deletar seu próprio usuário" },
        { status: 400 }
      )
    }

    const utilizador = await prisma.user.findUnique({
      where: { id: params.id },
    })

    if (!utilizador) {
      return NextResponse.json(
        { error: "Utilizador não encontrado" },
        { status: 404 }
      )
    }

    await prisma.user.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: "Utilizador deletado com sucesso" })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao deletar utilizador" },
      { status: 500 }
    )
  }
}

