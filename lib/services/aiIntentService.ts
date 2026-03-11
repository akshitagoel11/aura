import { google } from 'googleapis';
import { gmailService } from './gmailService';
import { googleTasksService } from './googleTasksService';
import { calendarService } from './calendarService';

// Groq API configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export interface Intent {
  type: 'send_email' | 'create_task' | 'create_reminder' | 'normal_chat';
  parameters: {
    to?: string;
    subject?: string;
    body?: string;
    title?: string;
    description?: string;
    dueDate?: string;
    eventTime?: string;
    [key: string]: any;
  };
  confidence: number;
}

export interface IntentResult {
  success: boolean;
  type: 'email' | 'task' | 'reminder' | 'chat';
  data?: any;
  error?: string;
}

export interface ChatResponse {
  response: string;
  suggestions?: string[];
}

export class AIIntentService {
  private groqApiKey: string;

  constructor() {
    this.groqApiKey = process.env.GROQ_API_KEY || '';
    
    if (!this.groqApiKey) {
      console.warn('Groq API key not found. AI intent detection will not work.');
    }
  }

  async detectIntent(message: string): Promise<Intent> {
    try {
      if (!this.groqApiKey) {
        console.log('[AI Intent] Groq API key not found, using fallback detection');
        return this.fallbackIntentDetection(message);
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are an AI assistant that detects user intents. Classify the user message into one of these categories: send_email, create_task, create_reminder, or normal_chat. Also extract relevant parameters like email addresses, subjects, task titles, etc. Respond with JSON only.'
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.1,
          max_tokens: 150,
        }),
      });

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content;

      if (aiResponse) {
        try {
          const parsed = JSON.parse(aiResponse);
          return {
            type: parsed.type || 'normal_chat',
            parameters: parsed.parameters || {},
            confidence: parsed.confidence || 0.8
          };
        } catch (parseError) {
          console.log('[AI Intent] Failed to parse Groq response, using fallback');
          return this.fallbackIntentDetection(message);
        }
      }

      return this.fallbackIntentDetection(message);
    } catch (error) {
      console.error('[AI Intent] Error detecting intent:', error);
      return this.fallbackIntentDetection(message);
    }
  }

  async processIntent(
    intent: string,
    intentType: string,
    userEmail: string,
    preview?: any
  ): Promise<IntentResult> {
    try {
      console.log(`[AI Intent] Processing ${intentType} intent:`, intent);

      switch (intentType) {
        case 'send_email':
          return await this.processEmailIntent(intent, userEmail, preview);
        
        case 'create_task':
          return await this.processTaskIntent(intent, userEmail, preview);
        
        case 'create_reminder':
          return await this.processReminderIntent(intent, userEmail, preview);
        
        case 'normal_chat':
          return await this.processChatIntent(intent, preview);
        
        default:
          return {
            success: false,
            type: 'chat',
            error: `Unknown intent type: ${intentType}`
          };
      }
    } catch (error) {
      console.error('[AI Intent] Error processing intent:', error);
      return {
        success: false,
        type: intentType as any,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async processEmailIntent(intent: string, userEmail: string, preview?: any): Promise<IntentResult> {
    const emailData = preview || {
      to: this.extractEmail(intent),
      subject: this.extractSubject(intent),
      body: intent
    };

    const result = await gmailService.sendEmail(userEmail, emailData);
    
    return {
      success: result.success,
      type: 'email',
      data: {
        messageId: result.messageId,
        to: emailData.to,
        subject: emailData.subject
      },
      error: result.error
    };
  }

  private async processTaskIntent(intent: string, userEmail: string, preview?: any): Promise<IntentResult> {
    const taskData = preview || {
      title: this.extractTaskTitle(intent),
      description: this.extractTaskDescription(intent),
      priority: this.extractPriority(intent),
      dueDate: this.extractDueDate(intent)
    };

    const result = await googleTasksService.createTask(userEmail, taskData);
    
    return {
      success: result.success,
      type: 'task',
      data: {
        taskId: result.taskId,
        title: taskData.title,
        description: taskData.description,
        priority: taskData.priority,
        dueDate: taskData.dueDate
      },
      error: result.error
    };
  }

  private async processReminderIntent(intent: string, userEmail: string, preview?: any): Promise<IntentResult> {
    const reminderData = preview || {
      title: this.extractReminderTitle(intent),
      description: this.extractReminderDescription(intent),
      dateTime: this.extractReminderDateTime(intent),
      reminderMinutes: 15 // Default 15 minutes before
    };

    const result = await calendarService.createEvent(userEmail, reminderData);
    
    return {
      success: result.success,
      type: 'reminder',
      data: {
        eventId: result.eventId,
        title: reminderData.title,
        description: reminderData.description,
        dateTime: reminderData.dateTime
      },
      error: result.error
    };
  }

  private async processChatIntent(intent: string, preview?: any): Promise<IntentResult> {
    // Simple AI chat response - in a real implementation, this would call an LLM
    const response = await this.generateAIResponse(intent);
    
    return {
      success: true,
      type: 'chat',
      data: response
    };
  }

  private fallbackIntentDetection(message: string): Intent {
    const lowerMessage = message.toLowerCase();

    // Email detection
    if (lowerMessage.includes('email') || lowerMessage.includes('send') || lowerMessage.includes('mail')) {
      const emailMatch = message.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      return {
        type: 'send_email',
        parameters: {
          to: emailMatch?.[1],
          subject: this.extractSubject(message),
          body: this.extractBody(message)
        },
        confidence: 0.7
      };
    }

    // Task detection
    if (lowerMessage.includes('task') || lowerMessage.includes('todo') || lowerMessage.includes('to-do')) {
      return {
        type: 'create_task',
        parameters: {
          title: this.extractTaskTitle(message),
          description: this.extractTaskDescription(message),
          dueDate: this.extractDueDate(message)
        },
        confidence: 0.7
      };
    }

    // Reminder detection
    if (lowerMessage.includes('remind') || lowerMessage.includes('reminder') || lowerMessage.includes('schedule')) {
      return {
        type: 'create_reminder',
        parameters: {
          title: this.extractTaskTitle(message),
          description: this.extractTaskDescription(message),
          eventTime: this.extractEventTime(message)
        },
        confidence: 0.7
      };
    }

    // Default to normal chat
    return {
      type: 'normal_chat',
      parameters: {},
      confidence: 0.5
    };
  }

  private extractBody(message: string): string {
    // Remove common patterns to get the body content
    return message
      .replace(/subject[:\s]+(.+?)(?:\n|$)/gi, '')
      .replace(/to[:\s]+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi, '')
      .replace(/send\s+(email|mail)/gi, '')
      .trim();
  }

  private extractEventTime(message: string): string | undefined {

  private async generateAIResponse(userInput: string): Promise<ChatResponse> {
    try {
      if (!this.groqApiKey) {
        // Fallback to simple responses if no Groq API key
        const responses = [
          "I understand you want help with that task.",
          "That sounds like a good plan. Let me know if you need any assistance.",
          "I can help you organize that. Would you like me to set up any reminders?",
          "Great! I've noted that down for you."
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        
        return {
          response: randomResponse,
          suggestions: []
        };
      }

      const response = await fetch(GROQ_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.groqApiKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful AI assistant for a productivity platform. Respond naturally and helpfully to user requests.'
            },
            {
              role: 'user',
              content: userInput
            }
          ],
          temperature: 0.7,
          max_tokens: 150,
        }),
      });
    }
    if (userInput.toLowerCase().includes('email')) {
      suggestions.push('Consider who needs to be CC\'d on the email');
    }

    return {
      response: randomResponse,
      suggestions
    };
  }

  // Helper methods for extracting information from natural language
  private extractEmail(text: string): string {
    const emailMatch = text.match(/to\s+([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    return emailMatch ? emailMatch[1] : 'user@example.com';
  }

  private extractSubject(text: string): string {
    const subjectMatch = text.match(/subject[:\s]+(.+)/i);
    return subjectMatch ? subjectMatch[1] : text.substring(0, 50);
  }

  private extractTaskTitle(text: string): string {
    const titleMatch = text.match(/task[:\s]+(.+)/i);
    return titleMatch ? titleMatch[1] : text.substring(0, 50);
  }

  private extractTaskDescription(text: string): string | undefined {
    const descMatch = text.match(/description[:\s]+(.+)/i);
    return descMatch ? descMatch[1] : undefined;
  }

  private extractPriority(text: string): 'high' | 'medium' | 'low' {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('urgent') || lowerText.includes('important') || lowerText.includes('high')) {
      return 'high';
    }
    if (lowerText.includes('medium')) {
      return 'medium';
    }
    return 'low';
  }

  private extractDueDate(text: string): string | undefined {
    const dateMatch = text.match(/(?:due|by|on)\s+([a-zA-Z0-9\s,:]+)/i);
    return dateMatch ? dateMatch[1] : undefined;
  }

  private extractReminderTitle(text: string): string {
    const titleMatch = text.match(/remind(?:er)?[:\s]+(.+)/i);
    return titleMatch ? titleMatch[1] : text.substring(0, 50);
  }

  private extractReminderDescription(text: string): string | undefined {
    const descMatch = text.match(/description[:\s]+(.+)/i);
    return descMatch ? descMatch[1] : undefined;
  }

  private extractReminderDateTime(text: string): string {
    const timeMatch = text.match(/(?:at|for|on)\s+([a-zA-Z0-9\s,:]+)/i);
    if (timeMatch) {
      const timeStr = timeMatch[1];
      const date = new Date(timeStr);
      return isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
    }
    return new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow as default
  }
}

export const aiIntentService = new AIIntentService();
