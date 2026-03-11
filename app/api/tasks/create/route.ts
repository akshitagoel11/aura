import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { createTasksClient } from '@/lib/googleClient';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('[Tasks Create] Request received');
    
    const session = await getServerSession(authOptions);
    console.log('[Tasks Create] SESSION:', session);
    console.log('[Tasks Create] Session found:', !!session);
    console.log('[Tasks Create] Access token in session:', !!(session as any)?.accessToken);
    
    if (!session || !(session as any)?.accessToken) {
      console.log('[Tasks Create] No session or access token');
      return NextResponse.json({
        success: false,
        error: 'User not authenticated or no access token'
      }, { status: 401 });
    }

    const { title, notes, due } = await request.json();
    console.log('[Tasks Create] Task data:', { title, notes, due });

    if (!title) {
      return NextResponse.json({
        success: false,
        error: 'Title is required'
      }, { status: 400 });
    }

    // Create Tasks client
    const tasks = createTasksClient(session as any);
    
    // Prepare task object
    const taskData: any = {
      title: title,
      notes: notes || ''
    };

    if (due) {
      taskData.due = due;
    }

    console.log('[Tasks Create] Creating task...');
    
    // Insert task
    const response = await tasks.tasks.insert({
      tasklist: '@default', // Use default task list
      requestBody: taskData
    });

    console.log('[Tasks Create] Task created successfully:', response.data);

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
          type: 'task_created',
          description: `Task created: ${title}`,
          status: 'completed',
          metadata: JSON.stringify({
            taskId: response.data.id,
            title,
            notes,
            due
          })
        }
      });

      // Also save to local tasks table
      await prisma.task.create({
        data: {
          userId: user.id,
          title,
          dueDate: due ? new Date(due) : null,
          status: 'pending'
        }
      });
    } catch (dbError) {
      console.error('[Tasks Create] Database error:', dbError);
      // Continue even if database fails
    }
    
    return NextResponse.json({
      success: true,
      task: {
        id: response.data.id,
        title: title,
        notes: notes,
        dueDate: due
      }
    });

  } catch (error) {
    console.error('[Tasks Create] Error:', error);
    console.error('[Tasks Create] Error details:', JSON.stringify(error, null, 2));
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 });
  }
}
