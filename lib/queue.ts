import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

// Redis connection
const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: 3,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
});

// Create queues for different job types
export const emailQueue = new Queue('email-queue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const taskQueue = new Queue('task-queue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const reminderQueue = new Queue('reminder-queue', {
  connection,
  defaultJobOptions: {
    removeOnComplete: 10,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

// Generic function to add scheduled jobs
export async function addScheduledJob(data: {
  userId: string;
  actionType: 'email' | 'task' | 'reminder';
  payload: any;
  scheduledTime: Date;
}) {
  const { userId, actionType, payload, scheduledTime } = data;
  
  console.log(`[Queue] Adding scheduled job:`, {
    userId,
    actionType,
    scheduledTime: scheduledTime.toISOString(),
    currentTime: new Date().toISOString(),
  });

  const delay = scheduledTime.getTime() - Date.now();
  
  if (delay <= 0) {
    // Execute immediately if time is in the past
    console.log(`[Queue] Scheduled time is in the past, executing immediately`);
    return executeJob(actionType, payload);
  }

  // Add to appropriate queue with delay
  const queue = getQueueByType(actionType);
  
  const job = await queue.add(
    actionType,
    {
      userId,
      ...payload,
    },
    {
      delay,
      jobId: `${actionType}-${userId}-${Date.now()}`,
      removeOnComplete: 100,
      removeOnFail: 100,
    }
  );

  console.log(`[Queue] Job added to queue:`, job.id);
  return job;
}

function getQueueByType(actionType: string) {
  switch (actionType) {
    case 'email':
      return emailQueue;
    case 'task':
      return taskQueue;
    case 'reminder':
      return reminderQueue;
    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

// Execute job immediately
async function executeJob(actionType: string, payload: any) {
  console.log(`[Queue] Executing job immediately:`, { actionType, payload });
  
  try {
    switch (actionType) {
      case 'email':
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/gmail/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return await response.json();
        
      case 'task':
        const taskResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/tasks/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return await taskResponse.json();
        
      case 'reminder':
        const reminderResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/calendar/reminder`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return await reminderResponse.json();
        
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  } catch (error) {
    console.error(`[Queue] Error executing job:`, error);
    throw error;
  }
}

// Close queues gracefully
export async function closeQueues() {
  await Promise.all([
    emailQueue.close(),
    taskQueue.close(),
    reminderQueue.close(),
  ]);
  console.log('[Queue] All queues closed');
}
