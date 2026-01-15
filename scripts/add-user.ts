import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {

  const args = process.argv.slice(2)
  
  if (args.length < 3) {
    console.log("❌ Uso: npm run add-user <email> <senha> <role> [nome]")
    console.log("")
    console.log("Exemplos:")
    console.log('  npm run add-user "editor@qrfleet.com" "senha123" "EDITOR" "João Silva"')
    console.log('  npm run add-user "admin@qrfleet.com" "senha123" "ADMIN"')
    console.log("")
    console.log("Roles disponíveis: ADMIN, EDITOR")
    process.exit(1)
  }

  const email = args[0]
  const password = args[1]
  const role = args[2].toUpperCase() as "ADMIN" | "EDITOR"
  const name = args[3] || null

  if (role !== "ADMIN" && role !== "EDITOR") {
    console.log("❌ Role inválido. Use ADMIN ou EDITOR")
    process.exit(1)
  }

  if (!email.includes("@")) {
    console.log("❌ Email inválido")
    process.exit(1)
  }

  if (password.length < 6) {
    console.log("❌ Senha deve ter pelo menos 6 caracteres")
    process.exit(1)
  }

  try {

    const existing = await prisma.user.findUnique({
      where: { email },
    })

    if (existing) {
      console.log(`❌ Email ${email} já existe no sistema`)
      process.exit(1)
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
        name: name || null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    console.log("")
    console.log("✅ Usuário criado com sucesso!")
    console.log("")
    console.log("📋 Detalhes:")
    console.log(`   Email: ${user.email}`)
    console.log(`   Nome: ${user.name || "(não definido - usará primeira parte do email)"}`)
    console.log(`   Role: ${user.role}`)
    console.log(`   ID: ${user.id}`)
    console.log(`   Criado em: ${user.createdAt.toLocaleString("pt-PT")}`)
    console.log("")
    console.log("🔐 Credenciais de login:")
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${password}`)
    console.log("")
  } catch (error: any) {
    console.error("❌ Erro ao criar usuário:", error.message)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

