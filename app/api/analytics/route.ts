import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    const { action } = await request.json();
    
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action is required'
      }, { status: 400 });
    }

    // Get or create user
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: { updatedAt: new Date() },
      create: {
        email: session.user.email
      }
    });

    // Log the action
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: action,
        description: `Analytics: ${action}`,
        status: 'completed',
        metadata: JSON.stringify({
          timestamp: new Date().toISOString()
        })
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Action logged successfully'
    });

  } catch (error) {
    console.error('[Analytics Log] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

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
      // Get user
      const user = await prisma.user.upsert({
        where: { email: session.user.email },
        update: { updatedAt: new Date() },
        create: {
          email: session.user.email
        }
      });

      // Get today's activities
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const activities = await prisma.activity.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      });

      // Count different types
      const analytics = {
        aiQueries: activities.filter(a => a.type === 'chat_interaction').length,
        emailsSent: activities.filter(a => a.type === 'email_sent').length,
        tasksAdded: activities.filter(a => a.type === 'task_created').length,
        remindersScheduled: activities.filter(a => a.type === 'reminder_created').length,
        totalActivities: activities.length
      };

      return NextResponse.json({
        success: true,
        analytics
      });
    } catch (dbError) {
      console.error('Database error in analytics:', dbError);
      // Return zero analytics if database fails
      return NextResponse.json({
        success: true,
        analytics: {
          aiQueries: 0,
          emailsSent: 0,
          tasksAdded: 0,
          remindersScheduled: 0,
          totalActivities: 0
        }
      });
    }

  } catch (error) {
    console.error('[Analytics Get] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
