import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {

  const hashedPassword = await bcrypt.hash("admin123", 10)

  const admin = await prisma.user.upsert({
    where: { email: "admin@wibix.com" },
    update: {},
    create: {
      email: "admin@wibix.com",
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

