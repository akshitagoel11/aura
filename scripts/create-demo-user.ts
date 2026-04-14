import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  const email = "gaurav@gmail.com"
  const password = "password123"
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
      },
      create: {
        email,
        name: "Demo User",
        password: hashedPassword,
        preferences: {
          create: {
            workingHoursStart: 9,
            workingHoursEnd: 17,
            workingDays: "1,2,3,4,5",
            timezone: "UTC",
            aiProvider: "openai",
            theme: "system",
            notifications: true,
          },
        },
      },
    })

    console.log("-----------------------------------------")
    console.log("✅ Demo user created/updated successfully!")
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log("-----------------------------------------")
  } catch (error) {
    console.error("Error creating demo user:", error)
  } finally {
    await prisma.$disconnect()
  }
}

main()
