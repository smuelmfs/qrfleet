import { prisma } from "./prisma"
import { NextRequest } from "next/server"

export async function createAuditLog(
  userId: string,
  acao: string,
  entidade: string,
  entidadeId?: string,
  detalhes?: string,
  request?: NextRequest
) {
  try {
    const ipAddress = request
      ? request.headers.get("x-forwarded-for") ||
        request.headers.get("x-real-ip") ||
        undefined
      : undefined

    const userAgent = request
      ? request.headers.get("user-agent") || undefined
      : undefined

    await prisma.auditoria.create({
      data: {
        userId,
        acao,
        entidade,
        entidadeId,
        detalhes,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    console.error("Erro ao criar registro de auditoria:", error)
  }
}

