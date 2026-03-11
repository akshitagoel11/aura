// src/utils/errorHandler.ts

import { toast } from './notifications';

export function handleAuraAIError(error: any) {
  if (error.response) {
    // Server responded with error
    const message = error.response.data?.error || 'Server error occurred';
    toast.error(message);
  } else if (error.request) {
    // Request made but no response
    toast.error('Network error - please check your connection');
  } else {
    // Other errors
    toast.error(error.message || 'An unexpected error occurred');
  }
}

export function logError(error: any, context?: string) {
  console.error('Aura AI Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString(),
  });
}
