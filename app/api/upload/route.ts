import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

const MAX_FILE_SIZE_IMAGE = 3 * 1024 * 1024 // 3MB para imagens
const MAX_FILE_SIZE_DOCUMENT = 10 * 1024 * 1024 // 10MB para documentos
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "text/plain",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const fileType = formData.get("fileType") as string | null // "image" ou "document"

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo enviado" },
        { status: 400 }
      )
    }

    // Determinar tipo de arquivo se não especificado
    const isImage = file.type.startsWith("image/")
    const isDocument = !isImage
    const actualFileType = fileType || (isImage ? "image" : "document")

    // Validar tipo
    if (actualFileType === "image") {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Tipo de arquivo não permitido. Use JPG, PNG ou WEBP" },
          { status: 400 }
        )
      }
      // Validar tamanho para imagens
      if (file.size > MAX_FILE_SIZE_IMAGE) {
        return NextResponse.json(
          { error: "Arquivo muito grande. Tamanho máximo: 3MB" },
          { status: 400 }
        )
      }
    } else {
      if (!ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
        return NextResponse.json(
          { error: "Tipo de arquivo não permitido. Use PDF, DOC, DOCX, XLS, XLSX, TXT ou imagens" },
          { status: 400 }
        )
      }
      // Validar tamanho para documentos
      if (file.size > MAX_FILE_SIZE_DOCUMENT) {
        return NextResponse.json(
          { error: "Arquivo muito grande. Tamanho máximo: 10MB" },
          { status: 400 }
        )
      }
    }

    // Criar diretório se não existir
    const uploadDir = join(process.cwd(), "public", "uploads")
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Gerar nome único
    const timestamp = Date.now()
    const extension = file.name.split(".").pop()
    const filename = `${timestamp}-${Math.random().toString(36).substring(7)}.${extension}`
    const filepath = join(uploadDir, filename)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filepath, buffer)

    // Retornar URL pública
    const url = `/uploads/${filename}`

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Erro ao fazer upload:", error)
    return NextResponse.json(
      { error: "Erro ao fazer upload do arquivo" },
      { status: 500 }
    )
  }
}

