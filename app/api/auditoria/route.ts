import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const auditoria = await prisma.auditoria.findMany({
      select: {
        id: true,
        acao: true,
        entidade: true,
        entidadeId: true,
        detalhes: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 500,  
    })

    return NextResponse.json(auditoria)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao buscar auditoria" },
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
    const { acao, entidade, entidadeId, detalhes, ipAddress, userAgent } = body

    const userEmail = session.user?.email
    if (!userEmail) {
      return NextResponse.json({ error: "Email do usuário não encontrado" }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
    })

    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const auditoria = await prisma.auditoria.create({
      data: {
        userId: user.id,
        acao,
        entidade,
        entidadeId,
        detalhes,
        ipAddress: ipAddress || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || undefined,
        userAgent: userAgent || request.headers.get("user-agent") || undefined,
      },
    })

    return NextResponse.json(auditoria)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Erro ao criar registro de auditoria" },
      { status: 500 }
    )
  }
}

