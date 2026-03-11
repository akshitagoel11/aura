// src/utils/notifications.ts

import { ExecuteResponse } from '@/services/auraAI.service';

// Simple toast notification implementation
// Replace with your preferred toast library (react-hot-toast, sonner, etc.)

interface ToastOptions {
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class ToastManager {
  success(message: string, options?: ToastOptions) {
    console.log('✅ SUCCESS:', message);
    if (options?.description) {
      console.log('Description:', options.description);
    }
    if (options?.action) {
      console.log('Action:', options.action.label);
    }
    
    // In a real implementation, you would use a toast library here:
    // toast.success(message, options);
    
    // For now, we'll create a simple DOM-based notification
    this.showNotification(message, 'success', options);
  }

  error(message: string) {
    console.error('❌ ERROR:', message);
    this.showNotification(message, 'error');
  }

  info(message: string) {
    console.log('ℹ️ INFO:', message);
    this.showNotification(message, 'info');
  }

  private showNotification(message: string, type: 'success' | 'error' | 'info', options?: ToastOptions) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
      color: white;
      padding: 16px 20px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      z-index: 9999;
      max-width: 400px;
      margin-bottom: 10px;
      animation: slideIn 0.3s ease-out;
    `;

    notification.innerHTML = `
      <div style="font-weight: 600; margin-bottom: 4px;">${message}</div>
      ${options?.description ? `<div style="font-size: 14px; opacity: 0.9;">${options.description}</div>` : ''}
      ${options?.action ? `<button style="margin-top: 8px; background: white; color: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'}; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 12px;">${options.action.label}</button>` : ''}
    `;

    // Add click handler for action button
    if (options?.action) {
      const button = notification.querySelector('button');
      button?.addEventListener('click', () => {
        options.action!.onClick();
        document.body.removeChild(notification);
      });
    }

    // Add to DOM
    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 5000);

    // Add animation styles if not already added
    if (!document.getElementById('notification-styles')) {
      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

export const toast = new ToastManager();

export function showSuccessNotification(response: ExecuteResponse) {
  const messages = {
    email_sent: `✉️ Email sent successfully to ${response.result.to.join(', ')}`,
    task_created: `✅ Task "${response.result.title}" created in Google Tasks`,
    reminder_created: `⏰ Reminder "${response.result.title}" added to Google Calendar`,
    chat_response_delivered: `💬 Chat response delivered`,
  };

  const message = messages[response.action as keyof typeof messages] || 'Action completed successfully';
  
  toast.success(message, {
    description: response.message,
    action: response.result.taskLink || response.result.eventLink ? {
      label: 'View',
      onClick: () => window.open(response.result.taskLink || response.result.eventLink, '_blank'),
    } : undefined,
  });
}
