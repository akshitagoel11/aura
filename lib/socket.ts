import { Server as NetServer } from 'http';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import IORedis from 'ioredis';

// Redis connection for Socket.IO adapter
const redis = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379');
const socketAdapter = createAdapter(redis);

export interface NotificationData {
  type: 'task_created' | 'task_pending' | 'task_completed' | 'reminder_triggered' | 'email_sent';
  userId: string;
  data: any;
  timestamp: Date;
}

export interface TaskUpdateData {
  taskId: string;
  userId: string;
  status: 'pending' | 'in_progress' | 'completed';
  timestamp: Date;
}

class SocketManager {
  private static instance: SocketManager;
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  private constructor(server: NetServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? false 
          : ["http://localhost:3000"],
        methods: ["GET", "POST"],
        credentials: true,
      },
      adapter: socketAdapter,
      transports: ['websocket', 'polling'],
    });

    this.setupEventHandlers();
  }

  public static getInstance(server: NetServer): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager(server);
    }
    return SocketManager.instance;
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`[Socket.IO] User connected:`, socket.id);

      // Handle user authentication
      socket.on('authenticate', async (data: { userId: string; token?: string }) => {
        try {
          // Here you could validate the token if needed
          const { userId } = data;
          
          // Store user connection
          this.connectedUsers.set(userId, socket.id);
          socket.userId = userId; // Attach userId to socket
          
          console.log(`[Socket.IO] User authenticated:`, { userId, socketId: socket.id });
          
          // Join user-specific room
          socket.join(`user_${userId}`);
          
          socket.emit('authenticated', { success: true, userId });
          
          // Send user's pending notifications
          await this.sendPendingNotifications(userId, socket);
          
        } catch (error) {
          console.error(`[Socket.IO] Authentication error:`, error);
          socket.emit('authentication_error', { error: 'Authentication failed' });
        }
      });

      // Handle task updates
      socket.on('task_update', async (data: TaskUpdateData) => {
        try {
          console.log(`[Socket.IO] Task update:`, data);
          
          // Update task in database
          await this.updateTaskInDatabase(data);
          
          // Broadcast to user's other sessions
          this.broadcastToUser(data.userId, 'task_updated', data, socket.id);
          
          // Log activity
          await this.logActivity(data.userId, 'task_status_updated', 
            `Task ${data.taskId} status changed to ${data.status}`, data);
            
        } catch (error) {
          console.error(`[Socket.IO] Task update error:`, error);
          socket.emit('error', { message: 'Failed to update task' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`[Socket.IO] User disconnected:`, socket.id);
        
        // Remove user from connected users
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
        }
      });
    });

    // Handle server-side events
    this.io.on('task_created', (data: NotificationData) => {
      console.log(`[Socket.IO] Broadcasting task created:`, data);
      this.broadcastToUser(data.userId, 'task_created', data.data);
    });

    this.io.on('reminder_triggered', (data: NotificationData) => {
      console.log(`[Socket.IO] Broadcasting reminder triggered:`, data);
      this.broadcastToUser(data.userId, 'reminder_triggered', data.data);
    });

    this.io.on('email_sent', (data: NotificationData) => {
      console.log(`[Socket.IO] Broadcasting email sent:`, data);
      this.broadcastToUser(data.userId, 'email_sent', data.data);
    });
  }

  // Send notification to specific user
  private broadcastToUser(userId: string, event: string, data: any, excludeSocketId?: string) {
    this.io.to(`user_${userId}`).except(excludeSocketId).emit(event, {
      type: event,
      data,
      timestamp: new Date(),
    });
  }

  // Send to all connected users
  public broadcast(event: string, data: any) {
    this.io.emit(event, {
      data,
      timestamp: new Date(),
    });
  }

  // Send pending notifications on connection
  private async sendPendingNotifications(userId: string, socket: any) {
    try {
      // Here you could fetch pending notifications from database
      // For now, we'll just send a welcome message
      socket.emit('pending_notifications', {
        message: 'Connected successfully',
        timestamp: new Date(),
      });
    } catch (error) {
      console.error(`[Socket.IO] Error sending pending notifications:`, error);
    }
  }

  // Update task in database (placeholder - implement actual logic)
  private async updateTaskInDatabase(data: TaskUpdateData) {
    // This would typically update your task database
    // For now, we'll just log it
    console.log(`[Socket.IO] Would update task in database:`, data);
  }

  // Log activity (placeholder - implement actual logic)
  private async logActivity(userId: string, type: string, description: string, metadata?: any) {
    try {
      // This would typically log to your activity database
      console.log(`[Socket.IO] Would log activity:`, { userId, type, description, metadata });
    } catch (error) {
      console.error(`[Socket.IO] Error logging activity:`, error);
    }
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is connected
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }
}

// Next.js API route handler
export default function SocketHandler(req: NextApiRequest, res: NextApiResponse) {
  if (!res.socket.server.io) {
    console.log('[Socket.IO] Initializing socket server...');
    const httpServer: NetServer = res.socket.server as any;
    const socketManager = SocketManager.getInstance(httpServer);
    
    // Store socket manager instance for external access
    (global as any).socketManager = socketManager;
    
    res.end();
  }
}

// Helper function to emit events from API routes
export function emitNotification(data: NotificationData) {
  const socketManager = (global as any).socketManager;
  if (socketManager) {
    socketManager.broadcast(data.type, data.data);
  }
}

// Helper function to emit to specific user
export function emitToUser(userId: string, event: string, data: any) {
  const socketManager = (global as any).socketManager;
  if (socketManager) {
    socketManager.broadcastToUser(userId, event, data);
  }
}
