import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { generateQRCode } from "@/lib/qrcode"
import { createAuditLog } from "@/lib/audit"
import * as XLSX from "xlsx"

const EXPECTED_HEADERS = ["PARC ", "MARQUE ", "MODELE ", "TONNAGE ", "ANNEE "]

function validateHeaders(headers: string[]): boolean {
  if (headers.length !== EXPECTED_HEADERS.length) {
    return false
  }
  
  return EXPECTED_HEADERS.every((expected, index) => {
    const actual = headers[index]?.trim()
    return actual === expected.trim()
  })
}

function validateRow(row: any[]): { valid: boolean; data?: any; error?: string } {
  if (row.length !== EXPECTED_HEADERS.length) {
    return { valid: false, error: "Número de colunas incorreto" }
  }

  const parc = String(row[0] || "").trim()
  const marque = String(row[1] || "").trim()
  const modele = String(row[2] || "").trim()
  const tonnage = String(row[3] || "").trim()
  const annee = String(row[4] || "").trim()

  if (!parc || parc === "") {
    return { valid: false, error: "PARC está vazio" }
  }

  if (!marque || marque === "") {
    return { valid: false, error: "MARQUE está vazio" }
  }

  if (!modele || modele === "") {
    return { valid: false, error: "MODELE está vazio" }
  }

  if (!annee || annee === "" || isNaN(Number(annee))) {
    return { valid: false, error: "ANNEE deve ser um número válido" }
  }

  const anneeNum = Number(annee)
  if (anneeNum < 1900 || anneeNum > new Date().getFullYear() + 1) {
    return { valid: false, error: `ANNEE inválido: ${annee}` }
  }

  return {
    valid: true,
    data: {
      parque: parc,
      marca: marque,
      modelo: modele,
      peso: tonnage || null,
      ano: anneeNum,
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      )
    }

    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    if (fileExtension !== "xlsx" && fileExtension !== "xls") {
      return NextResponse.json(
        { error: "Formato de arquivo inválido. Apenas arquivos Excel (.xlsx, .xls) são aceitos" },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: "array" })

    if (workbook.SheetNames.length === 0) {
      return NextResponse.json(
        { error: "A planilha está vazia" },
        { status: 400 }
      )
    }

    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: "",
    }) as any[][]

    if (jsonData.length < 2) {
      return NextResponse.json(
        { error: "A planilha deve ter pelo menos uma linha de cabeçalho e uma linha de dados" },
        { status: 400 }
      )
    }

    const headers = jsonData[0].map((h: any) => String(h || "").trim().replace(/\s+/g, " "))

    if (!validateHeaders(headers)) {
      return NextResponse.json(
        {
          error: "A planilha não segue o padrão esperado. Os cabeçalhos devem ser exatamente: PARC, MARQUE, MODELE, TONNAGE, ANNEE",
          expectedHeaders: EXPECTED_HEADERS,
          receivedHeaders: headers,
        },
        { status: 400 }
      )
    }

    const dataRows = jsonData.slice(1)
    const validData: any[] = []
    const errors: string[] = []

    dataRows.forEach((row, index) => {
      const cleanedRow = row.map((cell: any) => {
        if (cell === null || cell === undefined) return ""
        return String(cell).trim()
      })

      if (cleanedRow.every((cell) => cell === "")) {
        return
      }

      const validation = validateRow(cleanedRow)
      if (validation.valid && validation.data) {
        validData.push(validation.data)
      } else {
        errors.push(`Linha ${index + 2}: ${validation.error}`)
      }
    })

    if (validData.length === 0) {
      return NextResponse.json(
        {
          error: "Nenhum dado válido encontrado na planilha",
          errors: errors.slice(0, 10),
        },
        { status: 400 }
      )
    }

    const createdEquipamentos: any[] = []
    const creationErrors: string[] = []

    for (const item of validData) {
      try {
        const existing = await prisma.equipamento.findFirst({
          where: { parque: item.parque },
        })

        if (existing) {
          creationErrors.push(`Parque ${item.parque} já existe`)
          continue
        }

        const publicUrl = `${process.env.NEXTAUTH_URL}/equipament-view/${item.parque}`
        const qrCodeDataUrl = await generateQRCode(publicUrl)

        const equipamento = await prisma.equipamento.create({
          data: {
            tipo: "MAQUINA",
            parque: item.parque,
            peso: item.peso || null,
            modelo: item.modelo,
            marca: item.marca,
            ano: item.ano,
            qrCode: qrCodeDataUrl,
          },
        })

        const user = session.user as any
        await createAuditLog(
          user.id,
          "CREATE",
          "EQUIPAMENTO",
          equipamento.id,
          `Equipamento criado via importação: ${item.parque} - ${item.marca} ${item.modelo}`,
          request
        )

        createdEquipamentos.push(equipamento)
      } catch (error: any) {
        creationErrors.push(`Erro ao criar equipamento ${item.parque}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      created: createdEquipamentos.length,
      total: validData.length,
      data: createdEquipamentos,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
      creationErrors: creationErrors.length > 0 ? creationErrors.slice(0, 20) : undefined,
    })
  } catch (error: any) {
    console.error("Erro ao processar planilha:", error)
    return NextResponse.json(
      { error: `Erro ao processar planilha: ${error.message}` },
      { status: 500 }
    )
  }
}

