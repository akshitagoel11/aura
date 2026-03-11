import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { createCalendarClient } from '@/lib/googleClient';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[Calendar Reminder] Request received');
    
    const session = await getServerSession(authOptions);
    console.log('[Calendar Reminder] SESSION:', session);
    console.log('[Calendar Reminder] Session found:', !!session);
    console.log('[Calendar Reminder] Access token in session:', !!(session as any)?.accessToken);
    
    if (!session || !(session as any)?.accessToken) {
      console.log('[Calendar Reminder] No session or access token');
      return NextResponse.json({
        success: false,
        error: 'User not authenticated or no access token'
      }, { status: 401 });
    }

    const { title, description, time } = await request.json();
    console.log('[Calendar Reminder] Reminder data:', { title, description, time });

    if (!title || !time || time === "null" || time === "undefined") {
      return NextResponse.json({
        success: false,
        error: 'Title and valid time are required'
      }, { status: 400 });
    }

    // Validate that time is a valid date
    const eventTime = new Date(time);
    if (isNaN(eventTime.getTime())) {
      return NextResponse.json({
        success: false,
        error: 'Invalid time format. Please provide a valid datetime.'
      }, { status: 400 });
    }

    // Create Calendar client
    const calendar = createCalendarClient(session as any);
    
    // Prepare event object
    const eventData: any = {
      summary: title,
      description: description || '',
      start: {
        dateTime: eventTime.toISOString(),
        timeZone: 'UTC'
      },
      end: {
        dateTime: new Date(eventTime.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
        timeZone: 'UTC'
      },
      reminders: {
        useDefault: false,
        overrides: [
          {
            method: 'popup',
            minutes: 15 // 15 minutes before
          }
        ]
      }
    };

    console.log('[Calendar Reminder] Creating event...');
    
    // Insert event
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventData
    });

    console.log('[Calendar Reminder] Event created successfully:', response.data);

    // Log activity to database
    try {
      const user = await prisma.user.upsert({
        where: { email: session.user?.email || '' },
        update: { updatedAt: new Date() },
        create: {
          email: session.user?.email || ''
        }
      });

      await prisma.activity.create({
        data: {
          userId: user.id,
          type: 'reminder_created',
          description: `Reminder created: ${title}`,
          status: 'completed',
          metadata: JSON.stringify({
            eventId: response.data.id,
            title,
            description,
            time
          })
        }
      });

      // Also save to local reminders table
      await prisma.reminder.create({
        data: {
          userId: user.id,
          title,
          eventTime: eventTime
        }
      });
    } catch (dbError) {
      console.error('[Calendar Reminder] Database error:', dbError);
      // Continue even if database fails
    }
    
    return NextResponse.json({
      success: true,
      event: {
        id: response.data.id,
        title: title,
        description: description,
        time: time
      }
    });

  } catch (error) {
    console.error('[Calendar Reminder] Error:', error);
    console.error('[Calendar Reminder] Error details:', JSON.stringify(error, null, 2));
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
