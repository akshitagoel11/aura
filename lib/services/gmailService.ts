import { gmail_v1, google } from 'googleapis';
import { googleAuthService } from './googleAuthService';

export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
}

export class GmailService {
  async sendEmail(userEmail: string, emailData: EmailRequest): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      const auth = await googleAuthService.getAuthenticatedUser(userEmail);
      const gmail = new gmail_v1.Gmail({ auth });

      // Create the email message in the required format
      const email = [
        `To: ${emailData.to}`,
        emailData.cc ? `Cc: ${emailData.cc.join(', ')}` : '',
        emailData.bcc ? `Bcc: ${emailData.bcc.join(', ')}` : '',
        'Subject: ' + emailData.subject,
        '',
        emailData.body
      ].join('\n');

      const encodedMessage = Buffer.from(email)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '') || '';

      const message = {
        raw: encodedMessage
      };

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: message
      });

      return {
        success: true,
        messageId: response.data.id || ''
      };

    } catch (error) {
      console.error('Gmail Service Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async getEmailHistory(userEmail: string, maxResults: number = 50): Promise<any[]> {
    try {
      const auth = await googleAuthService.getAuthenticatedUser(userEmail);
      const gmail = new gmail_v1.Gmail({ auth });

      const response = await gmail.users.messages.list({
        userId: 'me',
        maxResults: maxResults,
        q: 'in:sent'
      });

      const messages = response.data.messages || [];
      const fullMessages = [];

      for (const message of messages) {
        if (!message.id) continue;
        
        const fullMessage = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
          format: 'metadata'
        });

        fullMessages.push({
          id: fullMessage.data.id || '',
          subject: this.getHeader(fullMessage.data.payload?.headers || [], 'Subject'),
          to: this.getHeader(fullMessage.data.payload?.headers || [], 'To'),
          date: fullMessage.data.internalDate || '',
          snippet: fullMessage.data.snippet || ''
        });
      }

      return fullMessages;
    } catch (error) {
      console.error('Error fetching email history:', error);
      return [];
    }
  }

  private getHeader(headers: any[], headerName: string): string {
    const header = headers.find((h: any) => h.name === headerName);
    return header ? header.value : '';
  }
}

export const gmailService = new GmailService();
