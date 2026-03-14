import { PrismaClient } from '@prisma/client';
import { emitToUser } from './socket';

const prisma = new PrismaClient();

// Define Severity enum since it's not exported from @prisma/client
enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM', 
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export class NotificationService {
  private static intervals: Map<string, NodeJS.Timeout> = new Map();
  private static notificationTimes: Record<string, number> = {
    LOW: 0,        // Notify once immediately
    MEDIUM: 60 * 60 * 1000,  // 1 hour in ms
    HIGH: 30 * 60 * 1000,    // 30 minutes in ms
    CRITICAL: 5 * 60 * 1000,   // 5 minutes in ms
  };

  /**
   * Start notifications for a task based on severity
   */
  static async startTaskNotifications(taskId: string, userId: string, severity: Severity) {
    try {
      console.log(`[Notification] Starting notifications for task:`, { taskId, userId, severity });

      // Send initial notification immediately
      await this.sendNotification(userId, {
        type: 'task_pending',
        taskId,
        severity,
        message: `Task "${taskId}" is pending and requires attention`,
        timestamp: new Date(),
      });

      // Set up recurring notifications based on severity
      if (severity !== 'LOW') {
        const intervalMs = this.notificationTimes[severity];
        
        const interval = setInterval(async () => {
          // Check if task still exists and is not completed
          const task = await prisma.task.findUnique({
            where: { id: taskId },
          });

          if (!task || task.status === 'completed') {
            // Stop notifications if task doesn't exist or is completed
            this.stopTaskNotifications(taskId);
            return;
          }

          // Send recurring notification
          await this.sendNotification(userId, {
            type: 'task_pending',
            taskId,
            severity,
            message: `Task "${task.title}" (${severity} priority) is still pending`,
            timestamp: new Date(),
          });

        }, intervalMs);

        this.intervals.set(taskId, interval);
        console.log(`[Notification] Started recurring notifications for task ${taskId}:`, { severity, intervalMs });
      }

    } catch (error) {
      console.error(`[Notification] Error starting task notifications:`, error);
    }
  }

  /**
   * Stop notifications for a task
   */
  static stopTaskNotifications(taskId: string) {
    const interval = this.intervals.get(taskId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(taskId);
      console.log(`[Notification] Stopped notifications for task:`, taskId);
    }
  }

  /**
   * Handle task completion
   */
  static async handleTaskCompletion(taskId: string, userId: string) {
    try {
      console.log(`[Notification] Handling task completion:`, { taskId, userId });

      // Stop recurring notifications
      this.stopTaskNotifications(taskId);

      // Update task status in database
      await prisma.task.update({
        where: { 
          id: taskId,
          userId, // Ensure user can only update their own tasks
        },
        data: {
          status: 'completed',
          updatedAt: new Date(),
        },
      });

      // Send completion notification
      await this.sendNotification(userId, {
        type: 'task_completed',
        taskId,
        message: `Task "${taskId}" has been completed!`,
        timestamp: new Date(),
      });

      // Broadcast real-time update
      emitToUser(userId, 'task_completed', {
        taskId,
        status: 'completed',
        timestamp: new Date(),
      });

      // Log activity
      await prisma.activity.create({
        data: {
          userId,
          type: 'task_completed',
          description: `Task "${taskId}" marked as completed`,
          status: 'completed',
          metadata: JSON.stringify({
            taskId,
            completedAt: new Date().toISOString(),
          }),
        },
      });

      console.log(`[Notification] Task completion processed:`, taskId);

    } catch (error) {
      console.error(`[Notification] Error handling task completion:`, error);
    }
  }

  /**
   * Send notification via Socket.IO and log to database
   */
  private static async sendNotification(userId: string, notification: {
    type: string;
    taskId?: string;
    severity?: Severity;
    message: string;
    timestamp: Date;
  }) {
    try {
      // Send via Socket.IO
      emitToUser(userId, 'notification', {
        ...notification,
      });

      // Log to activity
      await prisma.activity.create({
        data: {
          userId,
          type: notification.type,
          description: notification.message,
          status: 'completed',
          metadata: JSON.stringify({
            taskId: notification.taskId,
            severity: notification.severity,
          }),
        },
      });

      console.log(`[Notification] Notification sent:`, { userId, type: notification.type, message: notification.message });

    } catch (error) {
      console.error(`[Notification] Error sending notification:`, error);
    }
  }

  /**
   * Get active notifications for a user
   */
  static async getActiveNotifications(userId: string) {
    try {
      const tasks = await prisma.task.findMany({
        where: {
          userId,
          status: 'pending',
        },
        include: {
          user: true,
        },
      });

      return tasks.map(task => ({
        taskId: task.id,
        title: task.title,
        status: task.status,
        createdAt: task.createdAt,
        nextNotification: this.calculateNextNotification(Severity.MEDIUM, task.createdAt), // Default to MEDIUM for display
      }));
    } catch (error) {
      console.error(`[Notification] Error getting active notifications:`, error);
      return [];
    }
  }

  /**
   * Calculate next notification time based on severity
   */
  private static calculateNextNotification(severity: Severity, lastNotification?: Date): Date {
    const now = new Date();
    const intervalMs = this.notificationTimes[severity];

    if (severity === 'LOW') {
      // For LOW severity, only notify once
      return lastNotification || now;
    }

    // For other severities, calculate next notification time
    const baseTime = lastNotification || now;
    return new Date(baseTime.getTime() + intervalMs);
  }

  /**
   * Update task severity
   */
  static async updateTaskSeverity(taskId: string, userId: string, newSeverity: Severity) {
    try {
      // Update task in database
      const task = await prisma.task.update({
        where: {
          id: taskId,
          userId, // Ensure user can only update their own tasks
        },
        data: {
          updatedAt: new Date(),
        },
      });

      // Stop old notifications
      this.stopTaskNotifications(taskId);

      // Start new notifications with updated severity
      await this.startTaskNotifications(taskId, userId, newSeverity);

      // Send update notification
      await this.sendNotification(userId, {
        type: 'task_severity_updated',
        taskId,
        severity: newSeverity,
        message: `Task "${taskId}" severity updated to ${newSeverity}`,
        timestamp: new Date(),
      });

      console.log(`[Notification] Task severity updated:`, { taskId, newSeverity });

      return task;
    } catch (error) {
      console.error(`[Notification] Error updating task severity:`, error);
      throw error;
    }
  }

  /**
   * Clean up all intervals (call on server shutdown)
   */
  static cleanup() {
    console.log(`[Notification] Cleaning up ${this.intervals.size} notification intervals`);
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}
