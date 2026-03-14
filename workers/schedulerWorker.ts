import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import { addScheduledJob } from '../lib/queue';

const prisma = new PrismaClient();
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379') as any;

// Worker for processing scheduled jobs
const scheduledJobWorker = new Worker(
  'scheduled-jobs',
  async (job: Job) => {
    const { userId, actionType, payload, scheduledTime } = job.data;
    
    console.log(`[Scheduler Worker] Processing job:`, {
      jobId: job.id,
      userId,
      actionType,
      scheduledTime,
    });

    try {
      // Execute the action at the scheduled time
      const result = await executeScheduledAction(actionType, payload, userId);
      
      // Update job status in database
      await prisma.scheduledJob.update({
        where: { id: job.data.jobId || job.id },
        data: {
          status: 'executed',
          updatedAt: new Date(),
        },
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId,
          type: `${actionType}_scheduled_executed`,
          description: `Scheduled ${actionType} executed: ${payload.title || 'N/A'}`,
          status: 'completed',
          metadata: JSON.stringify({
            jobId: job.id,
            actionType,
            result,
            scheduledTime,
            executedAt: new Date().toISOString(),
          }),
        },
      });

      console.log(`[Scheduler Worker] Job completed successfully:`, job.id);
      return result;
      
    } catch (error) {
      console.error(`[Scheduler Worker] Job failed:`, { jobId: job.id, error });
      
      // Update job status to failed
      await prisma.scheduledJob.update({
        where: { id: job.data.jobId || job.id },
        data: {
          status: 'failed',
          updatedAt: new Date(),
        },
      });

      // Log failure
      await prisma.activity.create({
        data: {
          userId,
          type: `${actionType}_scheduled_failed`,
          description: `Scheduled ${actionType} failed: ${payload.title || 'N/A'}`,
          status: 'failed',
          metadata: JSON.stringify({
            jobId: job.id,
            actionType,
            error: error instanceof Error ? error.message : 'Unknown error',
            scheduledTime,
            failedAt: new Date().toISOString(),
          }),
        },
      });

      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
  }
);

// Execute the actual scheduled action
async function executeScheduledAction(actionType: string, payload: any, userId: string) {
  console.log(`[Scheduler Worker] Executing action:`, { actionType, payload, userId });
  
  switch (actionType) {
    case 'email':
      return await executeEmailAction(payload, userId);
    case 'task':
      return await executeTaskAction(payload, userId);
    case 'reminder':
      return await executeReminderAction(payload, userId);
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

// Execute email action
async function executeEmailAction(payload: any, userId: string) {
  console.log(`[Scheduler Worker] Sending email:`, payload);
  
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/gmail/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Email action failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log(`[Scheduler Worker] Email sent successfully:`, result);
  return result;
}

// Execute task action
async function executeTaskAction(payload: any, userId: string) {
  console.log(`[Scheduler Worker] Creating task:`, payload);
  
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/tasks/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Task action failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log(`[Scheduler Worker] Task created successfully:`, result);
  return result;
}

// Execute reminder action
async function executeReminderAction(payload: any, userId: string) {
  console.log(`[Scheduler Worker] Creating reminder:`, payload);
  
  const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar/reminder`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Reminder action failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log(`[Scheduler Worker] Reminder created successfully:`, result);
  return result;
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('[Scheduler Worker] Shutting down gracefully...');
  await scheduledJobWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Scheduler Worker] Shutting down gracefully...');
  await scheduledJobWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});

console.log('[Scheduler Worker] Started and listening for jobs...');
