import { NextRequest, NextResponse } from 'next/server';
import { gmailService } from '@/lib/services/gmailService';
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

    const { to, subject, body, cc, bcc } = await request.json();
    
    if (!to || !subject || !body) {
      return NextResponse.json({
        success: false,
        error: 'To, subject, and body are required'
      }, { status: 400 });
    }

    const result = await gmailService.sendEmail(userEmail, {
      to,
      subject,
      body,
      cc,
      bcc
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
            type: 'email_sent',
            description: `Email sent to ${to} with subject: ${subject}`,
            status: 'completed',
            metadata: JSON.stringify({
              messageId: result.messageId,
              to,
              subject,
              cc,
              bcc
            })
          }
        });
      }

      return NextResponse.json({
        success: true,
        email: {
          id: result.messageId,
          to,
          subject,
          body
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error || 'Failed to send email'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('[Email Send] Error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
