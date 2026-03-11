import { NextRequest, NextResponse } from 'next/server';
import { calendarService } from '@/lib/services/calendarService';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const userEmail = request.cookies.get('user_email')?.value;
    
    if (!userEmail) {
      return NextResponse.json({
        success: false,
        error: 'User not authenticated'
      }, { status: 401 });
    }

    const { title, description, dateTime, reminderMinutes } = await request.json();
    
    if (!title || !dateTime) {
      return NextResponse.json({
        success: false,
        error: 'Title and date/time are required'
      }, { status: 400 });
    }

    const result = await calendarService.createEvent(userEmail, {
      title,
      description,
      dateTime,
      reminderMinutes: reminderMinutes || 15
    });

    if (result.success) {
      // Log activity to database
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });

      if (user) {
        await prisma.activity.create({
          data: {
            userId: user.id,
            type: 'reminder_created',
            description: `Reminder created: ${title} at ${dateTime}`,
            status: 'completed',
            metadata: JSON.stringify({
              eventId: result.eventId,
              title,
              description,
              dateTime,
              reminderMinutes
            })
          }
        });

        // Also save to local reminders table
        await prisma.reminder.create({
          data: {
            userId: user.id,
            title,
            eventTime: new Date(dateTime),
            status: 'pending'
          }
        });
      }

      return NextResponse.json({
        success: true,
        reminder: {
          id: result.eventId,
          title,
          description,
          dateTime,
          reminderMinutes
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to create calendar event'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Calendar Create] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
