import { tasks_v1, google } from 'googleapis';
import { googleAuthService } from './googleAuthService';

export interface TaskRequest {
  title: string;
  description?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface GoogleTask {
  id: string;
  title: string;
  description?: string;
  status: 'needsAction' | 'completed';
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  createdAt: string;
}

export class GoogleTasksService {
  async createTask(userEmail: string, taskData: TaskRequest): Promise<{
    success: boolean;
    taskId?: string;
    error?: string;
  }> {
    try {
      const auth = await googleAuthService.getAuthenticatedUser(userEmail);
      const tasksClient = new tasks_v1.Tasks({ auth });

      // Get or create the default task list
      const taskLists = await tasksClient.tasklists.list();
      let taskListId = taskLists.data.items?.[0]?.id;

      if (!taskListId) {
        // Create a default task list if none exists
        const newTaskList = await tasksClient.tasklists.insert({
          requestBody: {
            title: 'My Tasks'
          }
        });
        taskListId = newTaskList.data.id!;
      }

      // Create the task with proper Google Tasks format
      const googleTask = {
        title: taskData.title,
        notes: taskData.description,
        due: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : undefined,
        status: 'needsAction'
      };

      const response = await tasksClient.tasks.insert({
        tasklist: taskListId,
        requestBody: googleTask
      });

      return {
        success: true,
        taskId: response.data.id || undefined
      };

    } catch (error) {
      console.error('Google Tasks Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUserTasks(userEmail: string): Promise<GoogleTask[]> {
    try {
      const auth = await googleAuthService.getAuthenticatedUser(userEmail);
      const tasksClient = new tasks_v1.Tasks({ auth });

      // Get all task lists
      const taskLists = await tasksClient.tasklists.list();
      const allTasks: GoogleTask[] = [];

      // Get tasks from all task lists
      for (const taskList of taskLists.data.items || []) {
        const tasksResponse = await tasksClient.tasks.list({
          tasklist: taskList.id!
        });

        const tasks = tasksResponse.data.items?.map((task: any) => ({
          id: task.id!,
          title: task.title!,
          description: task.notes,
          status: (task.status === 'completed' ? 'completed' : 'needsAction') as 'needsAction' | 'completed',
          dueDate: task.due,
          priority: this.extractPriority(task.title!),
          createdAt: task.created || new Date().toISOString()
        })) || [];

        allTasks.push(...tasks);
      }

      // Sort by creation date (newest first)
      return allTasks.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

    } catch (error) {
      console.error('Error fetching user tasks:', error);
      return [];
    }
  }

  async updateTaskStatus(userEmail: string, taskId: string, completed: boolean): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const auth = await googleAuthService.getAuthenticatedUser(userEmail);
      const tasksClient = new tasks_v1.Tasks({ auth });

      const response = await tasksClient.tasks.patch({
        tasklist: '@default', // Use default task list
        task: taskId,
        requestBody: {
          status: completed ? 'completed' : 'needsAction'
        }
      });

      return {
        success: true
      };

    } catch (error) {
      console.error('Error updating task status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private extractPriority(title: string): 'high' | 'medium' | 'low' {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('urgent') || lowerTitle.includes('important') || lowerTitle.includes('asap')) {
      return 'high';
    }
    if (lowerTitle.includes('medium') || lowerTitle.includes('normal')) {
      return 'medium';
    }
    return 'low';
  }
}

export const googleTasksService = new GoogleTasksService();
