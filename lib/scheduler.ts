import * as chrono from 'chrono-node';
import { PrismaClient } from '@prisma/client';
import { addScheduledJob } from './queue';

const prisma = new PrismaClient();

// Timezone configuration
const TIMEZONE = 'Asia/Kolkata';

export interface ScheduledAction {
  actionType: 'email' | 'task' | 'reminder';
  payload: {
    to?: string;
    subject?: string;
    body?: string;
    title?: string;
    notes?: string;
    due?: string;
    description?: string;
    time?: string;
  };
  scheduledTime: string;
}

export class NaturalLanguageScheduler {
  /**
   * Parse natural language date/time and create scheduled job
   */
  static async parseAndSchedule(
    input: string,
    userId: string,
    actionType: 'email' | 'task' | 'reminder'
  ): Promise<{ success: boolean; error?: string; data?: any }> {
    try {
      console.log(`[Scheduler] Parsing input:`, { input, actionType, userId });

      // Extract date/time from natural language
      const parsedDates = chrono.parse(input, {
        timezone: TIMEZONE,
      });

      if (parsedDates.length === 0) {
        return {
          success: false,
          error: 'Could not parse date/time from your message. Please try again with a specific time like "tomorrow at 3pm" or "March 15 at 10am".',
        };
      }

      const scheduledTime = parsedDates[0].date();
      const now = new Date();

      // Validate that the time is in the future
      if (scheduledTime <= now) {
        return {
          success: false,
          error: 'Scheduled time must be in the future. Please specify a future date and time.',
        };
      }

      // Extract action details based on action type
      const payload = this.extractPayload(input, actionType);
      
      // Store in database
      const scheduledJob = await prisma.scheduledJob.create({
        data: {
          userId,
          actionType,
          payload: JSON.stringify(payload),
          scheduledTime,
          status: 'pending',
        },
      });

      console.log(`[Scheduler] Created scheduled job:`, {
        jobId: scheduledJob.id,
        actionType,
        scheduledTime: scheduledTime.toISOString(),
        payload,
      });

      // Add to queue
      await addScheduledJob({
        userId,
        actionType,
        payload,
        scheduledTime,
      });

      return {
        success: true,
        data: {
          jobId: scheduledJob.id,
          actionType,
          scheduledTime: scheduledTime.toISOString(),
          parsedTime: scheduledTime.toLocaleString('en-US', { timeZone: TIMEZONE }),
        },
      };

    } catch (error) {
      console.error(`[Scheduler] Error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to schedule action',
      };
    }
  }

  /**
   * Extract action-specific payload from input
   */
  private static extractPayload(input: string, actionType: string): any {
    const lowerInput = input.toLowerCase();

    switch (actionType) {
      case 'email':
        return this.extractEmailPayload(lowerInput);
      case 'task':
        return this.extractTaskPayload(lowerInput);
      case 'reminder':
        return this.extractReminderPayload(lowerInput);
      default:
        throw new Error(`Unknown action type: ${actionType}`);
    }
  }

  /**
   * Extract email details from input
   */
  private static extractEmailPayload(input: string) {
    const emailRegex = /to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i;
    const subjectRegex = /subject[:\s]+(.+?)(?=\s+(body|message|$))/i;
    const bodyRegex = /(body|message)[:\s]+(.+)$/i;

    const emailMatch = input.match(emailRegex);
    const subjectMatch = input.match(subjectRegex);
    const bodyMatch = input.match(bodyRegex);

    return {
      to: emailMatch ? emailMatch[1] : undefined,
      subject: subjectMatch ? subjectMatch[1] : undefined,
      body: bodyMatch ? bodyMatch[1] : undefined,
    };
  }

  /**
   * Extract task details from input
   */
  private static extractTaskPayload(input: string) {
    const titleRegex = /(task|add|create)\s+(.+?)(?=\s+(due|on|by|at|$))/i;
    const dueRegex = /(due|on|by|at)\s+(.+?)(?=\s|$)/i;

    const titleMatch = input.match(titleRegex);
    const dueMatch = input.match(dueRegex);

    return {
      title: titleMatch ? titleMatch[1].trim() : input.trim(),
      due: dueMatch ? dueMatch[1].trim() : undefined,
    };
  }

  /**
   * Extract reminder details from input
   */
  private static extractReminderPayload(input: string) {
    const titleRegex = /(remind|reminder)\s+(.+?)(?=\s+(about|for|on|at|$))/i;
    const descriptionRegex = /(about|for)\s+(.+?)(?=\s+(on|at|$))/i;
    const timeRegex = /(on|at)\s+(.+?)$/i;

    const titleMatch = input.match(titleRegex);
    const descriptionMatch = input.match(descriptionRegex);
    const timeMatch = input.match(timeRegex);

    return {
      title: titleMatch ? titleMatch[1].trim() : input.trim(),
      description: descriptionMatch ? descriptionMatch[1].trim() : undefined,
      time: timeMatch ? timeMatch[1].trim() : undefined,
    };
  }

  /**
   * Get all scheduled jobs for a user
   */
  static async getScheduledJobs(userId: string) {
    try {
      const jobs = await prisma.scheduledJob.findMany({
        where: {
          userId,
          status: 'pending',
          scheduledTime: {
            gte: new Date(),
          },
        },
        orderBy: {
          scheduledTime: 'asc',
        },
      });

      return jobs.map(job => ({
        ...job,
        payload: JSON.parse(job.payload),
        scheduledTime: job.scheduledTime.toLocaleString('en-US', { timeZone: TIMEZONE }),
      }));
    } catch (error) {
      console.error(`[Scheduler] Error fetching scheduled jobs:`, error);
      return [];
    }
  }

  /**
   * Cancel a scheduled job
   */
  static async cancelScheduledJob(jobId: string, userId: string): Promise<any> {
    try {
      const job = await prisma.scheduledJob.update({
        where: {
          id: jobId,
          userId, // Ensure user can only cancel their own jobs
        },
        data: {
          status: 'cancelled',
          updatedAt: new Date(),
        },
      });

      console.log(`[Scheduler] Cancelled job:`, jobId);
      return job;
    } catch (error) {
      console.error(`[Scheduler] Error cancelling job:`, error);
      throw error;
    }
  }
}
