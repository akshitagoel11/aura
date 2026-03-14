import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/nextauth';
import { PrismaClient } from '@prisma/client';
import { NotificationService } from '@/lib/notifications';
import { emitToUser } from '@/lib/socket';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST' && req.method !== 'PATCH') {
    res.setHeader('Allow', 'POST, PATCH');
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const session = await getServerSession(authOptions, req);
    
    if (!session || !session.user?.email) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { taskId, status } = req.body;

    if (!taskId || !status) {
      res.status(400).json({ error: 'TaskId and status are required' });
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

    console.log(`[Task Update API] Processing request:`, { 
      userId: user.id, 
      taskId, 
      status,
      userEmail: session.user.email 
    });

    // Handle task completion
    if (status === 'completed') {
      await NotificationService.handleTaskCompletion(taskId, user.id);
      
      res.status(200).json({
        success: true,
        message: 'Task marked as completed',
        data: { taskId, status: 'completed' }
      });
      return;
    }

    // Handle other status updates
    const validStatuses = ['pending', 'in_progress', 'on_hold'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    // Update task status
    const task = await prisma.task.update({
      where: {
        id: taskId,
        userId, // Ensure user can only update their own tasks
      },
      data: {
        status,
        updatedAt: new Date(),
      },
    });

    // Send real-time update
    emitToUser(user.id, 'task_updated', {
      taskId,
      status,
      timestamp: new Date(),
    });

    // Log activity
    await prisma.activity.create({
      data: {
        userId: user.id,
        type: 'task_status_updated',
        description: `Task ${taskId} status updated to ${status}`,
        status: 'completed',
        metadata: JSON.stringify({
          taskId,
          oldStatus: 'unknown', // Would need to fetch current status first
          newStatus: status,
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    console.log(`[Task Update API] Task updated:`, { taskId, status });

    res.status(200).json({
      success: true,
      message: 'Task status updated',
      data: { taskId, status }
    });

  } catch (error) {
    console.error('[Task Update API] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
