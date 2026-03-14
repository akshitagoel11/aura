import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { PrismaClient } from '@prisma/client';
import { NaturalLanguageScheduler } from '@/lib/scheduler';
import { NotificationService } from '@/lib/notifications';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const session = await getServerSession(authOptions, req);
    
    if (!session || !session.user?.email) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { input, actionType } = req.body;

    if (!input || !actionType) {
      res.status(400).json({ error: 'Input and actionType are required' });
      return;
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    console.log(`[Schedule API] Processing request:`, { 
      userId: user.id, 
      input, 
      actionType,
      userEmail: session.user.email 
    });

    // Parse and schedule the action
    const result = await NaturalLanguageScheduler.parseAndSchedule(
      input,
      user.id,
      actionType as 'email' | 'task' | 'reminder'
    );

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.data,
        message: `${actionType} scheduled successfully`,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }

  } catch (error) {
    console.error('[Schedule API] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
