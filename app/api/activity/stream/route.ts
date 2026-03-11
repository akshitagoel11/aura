import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session || !session.user?.email) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Set up SSE headers
    const headers = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const data = `data: ${JSON.stringify({ type: 'connected', message: 'Activity stream connected' })}\n\n`;
        controller.enqueue(encoder.encode(data));

        // Send initial activities
        const sendActivities = async () => {
          try {
            if (!session.user?.email) {
              return;
            }

            // Get or create user
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
              take: 10
            });

            const activitiesData = `data: ${JSON.stringify({ type: 'update', data: activities })}\n\n`;
            controller.enqueue(encoder.encode(activitiesData));
          } catch (error) {
            console.error('Error fetching activities:', error);
            // Send empty activities if database fails
            const emptyData = `data: ${JSON.stringify({ type: 'update', data: [] })}\n\n`;
            controller.enqueue(encoder.encode(emptyData));
          }
        };

        // Send initial activities
        sendActivities();

        // Set up periodic updates
        const interval = setInterval(async () => {
          try {
            await sendActivities();
          } catch (error) {
            console.error('Error in periodic update:', error);
          }
        }, 10000); // Update every 10 seconds

        // Cleanup on disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('[Activity Stream] Error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
