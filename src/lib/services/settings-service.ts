import { prisma } from "@/lib/prisma"

export class SettingsService {
  /**
   * Get settings for a user
   */
  static async getSettings(userId: string) {
    let preferences = await prisma.userPreference.findUnique({
      where: { userId },
    })

    // Create defaults if they don't exist
    if (!preferences) {
      preferences = await prisma.userPreference.create({
        data: {
          userId,
          theme: "system",
          notifications: true,
          aiProvider: "gemini",
        },
      })
    }

    return preferences
  }

  /**
   * Update settings
   */
  static async updateSettings(userId: string, data: any) {
    return await prisma.userPreference.upsert({
      where: { userId },
      update: data,
      create: {
        userId,
        ...data,
      },
    })
  }
}
