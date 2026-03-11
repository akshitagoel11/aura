import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { aiIntentService } from '@/lib/services/aiIntentService';
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

    const { message } = await request.json();
    
    if (!message) {
      return NextResponse.json({
        success: false,
        error: 'Message is required'
      }, { status: 400 });
    }

    // Get or create user in database
    const user = await prisma.user.upsert({
      where: { email: session.user.email },
      update: { updatedAt: new Date() },
      create: {
        email: session.user.email
      }
    });

    // Save user message to database
    await prisma.message.create({
      data: {
        userId: user.id,
        role: 'user',
        content: message
      }
    });

    // Detect intent
    const intent = await aiIntentService.detectIntent(message);
    
    // Process the intent
    const result = await aiIntentService.processIntent(
      message,
      intent.type,
      session.user.email,
      intent.parameters
    );

    // Save assistant response to database
    if (result.success && result.data) {
      await prisma.message.create({
        data: {
          userId: user.id,
          role: 'assistant',
          content: typeof result.data === 'string' ? result.data : JSON.stringify(result.data)
        }
      });
    }

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'chat_interaction',
        description: `Chat interaction: ${intent.type}`,
        status: 'completed',
        metadata: JSON.stringify({
          intent: intent.type,
          confidence: intent.confidence,
          parameters: intent.parameters,
          result: result.success
        })
      }
    });

    return NextResponse.json({
      success: true,
      intent: intent.type,
      confidence: intent.confidence,
      parameters: intent.parameters,
      result: result
    });

  } catch (error) {
    console.error('[Chat Execute] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
