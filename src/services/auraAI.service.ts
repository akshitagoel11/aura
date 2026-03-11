// src/services/auraAI.service.ts

const API_BASE_URL = 'https://n8n.mediajade.com/webhook';

export interface PreviewRequest {
  userId: string;
  input: string;
}

export interface ExecuteRequest {
  userId: string;
  intentType: 'email' | 'task' | 'reminder' | 'chat';
  approvedPreview: any;
  executionId: string;
}

export interface PreviewResponse {
  success: boolean;
  userId: string;
  originalIntent: string;
  intentType: 'email' | 'task' | 'reminder' | 'chat';
  preview: any;
  confidence: number;
  reasoning: string;
  entities: any;
  timestamp: string;
  executionId: string;
}

export interface ExecuteResponse {
  success: boolean;
  executionId: string;
  userId: string;
  intentType: string;
  action: string;
  message: string;
  result: any;
  timestamp: string;
}

class AuraAIService {
  /**
   * Generate AI preview from user input
   */
  async generatePreview(request: PreviewRequest): Promise<PreviewResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Preview generation failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating preview:', error);
      throw error;
    }
  }

  /**
   * Execute approved preview
   */
  async executePreview(request: ExecuteRequest): Promise<ExecuteResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/ai-execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Execution failed: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error executing preview:', error);
      throw error;
    }
  }
}

export const auraAIService = new AuraAIService();
