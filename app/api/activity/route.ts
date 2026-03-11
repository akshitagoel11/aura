import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    try {
      // Get or create user in database
      const user = await prisma.user.upsert({
        where: { email: session.user.email },
        update: { updatedAt: new Date() },
        create: {
          email: session.user.email
        }
      });

      // Get recent activities
      const activities = await prisma.activity.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50
      });

      return NextResponse.json({
        success: true,
        activities: activities
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return empty activities if database fails
      return NextResponse.json({
        success: true,
        activities: []
      });
    }

  } catch (error) {
    console.error('[Activity Get] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
