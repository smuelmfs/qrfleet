import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  // Criar usuário admin padrão
  const hashedPassword = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@qrfleet.com" },
    update: {},
    create: {
      email: "admin@qrfleet.com",
      name: "Administrador",
      password: hashedPassword,
      role: "ADMIN",
    },
  })

  console.log("Usuário admin criado:", admin.email)
  console.log("Senha padrão: admin123")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

