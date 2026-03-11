import { calendar_v3, google } from 'googleapis';
import { googleAuthService } from './googleAuthService';

export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  startTime: string;
  endTime: string;
  reminders?: boolean;
}

export interface ReminderRequest {
  title: string;
  description?: string;
  dateTime: string;
  reminderMinutes?: number;
}

export class CalendarService {
  async createEvent(userEmail: string, eventData: ReminderRequest): Promise<{
    success: boolean;
    eventId?: string;
    error?: string;
  }> {
    try {
      const auth = await googleAuthService.getAuthenticatedUser(userEmail);
      const calendar = new calendar_v3.Calendar({ auth });

      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.dateTime,
          timeZone: 'UTC'
        },
        end: {
          dateTime: new Date(new Date(eventData.dateTime).getTime() + 60 * 60 * 1000).toISOString(), // 1 hour duration
          timeZone: 'UTC'
        },
        reminders: eventData.reminderMinutes ? {
          useDefault: false,
          overrides: [{
            method: 'email' as const,
            minutes: eventData.reminderMinutes
          }]
        } : undefined
      };

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      });

      return {
        success: true,
        eventId: response.data.id || ''
      };

    } catch (error) {
      console.error('Calendar Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getUpcomingEvents(userEmail: string, maxResults: number = 50): Promise<CalendarEvent[]> {
    try {
      const auth = await googleAuthService.getAuthenticatedUser(userEmail);
      const calendar = new calendar_v3.Calendar({ auth });

      const now = new Date().toISOString();
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: now,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.data.items?.map(event => ({
        id: event.id!,
        summary: event.summary!,
        description: event.description || undefined,
        startTime: event.start?.dateTime || event.start?.date || '',
        endTime: event.end?.dateTime || event.end?.date || '',
        reminders: !!(event.reminders?.overrides && event.reminders.overrides.length > 0)
      })) || [];

    } catch (error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  async updateEventStatus(userEmail: string, eventId: string, completed: boolean): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const auth = await googleAuthService.getAuthenticatedUser(userEmail);
      const calendar = new calendar_v3.Calendar({ auth });

      // Get the event first
      const eventResponse = await calendar.events.get({
        calendarId: 'primary',
        eventId: eventId
      });

      const event = eventResponse.data;
      
      // Update the event status by adding/removing completion marker
      const updatedSummary = completed 
        ? `✅ ${event.summary}` 
        : event.summary?.replace('✅ ', '');

      const response = await calendar.events.patch({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: {
          summary: updatedSummary,
          description: completed 
            ? `${event.description}\n\nCompleted at: ${new Date().toISOString()}`
            : event.description?.replace(/\n\nCompleted at:.*$/, '')
        }
      });

      return {
        success: true
      };

    } catch (error) {
      console.error('Error updating event status:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

export const calendarService = new CalendarService();
