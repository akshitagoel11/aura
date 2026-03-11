// src/components/AuraAIInput.tsx

import React, { useState } from 'react';
import { auraAIService, PreviewResponse, ExecuteResponse } from '../services/auraAI.service';
import { showSuccessNotification } from '../utils/notifications';
import { handleAuraAIError } from '../utils/errorHandler';
import PreviewCard from './PreviewCard';

// Mock user ID - replace with actual authentication
function getCurrentUserId(): string {
  // In a real app, this would come from your auth system
  // For now, we'll use a simple localStorage approach or a default
  const storedUserId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;
  return storedUserId || 'demo_user_123';
}

export default function AuraAIInput() {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Get user ID from auth system
      const userId = getCurrentUserId();
      
      // Generate preview
      const response = await auraAIService.generatePreview({
        userId,
        input: input.trim(),
      });

      // Show preview to user
      setPreview(response);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to generate preview';
      setError(errorMessage);
      handleAuraAIError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!preview) return;

    setLoading(true);
    setError(null);

    try {
      // Execute approved preview
      const response = await auraAIService.executePreview({
        userId: preview.userId,
        intentType: preview.intentType,
        approvedPreview: preview.preview,
        executionId: preview.executionId,
      });

      // Show success message
      showSuccessNotification(response);
      
      // Clear input and preview
      setInput('');
      setPreview(null);

      // Optionally refresh data (tasks, emails, etc.)
      // refreshUserData();
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to execute action';
      setError(errorMessage);
      handleAuraAIError(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = () => {
    setPreview(null);
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className="aura-ai-input">
      <style jsx>{`
        .aura-ai-input {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }

        .input-form {
          display: flex;
          gap: 12px;
          margin-bottom: 16px;
        }

        .input-field {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s;
          outline: none;
        }

        .input-field:focus {
          border-color: #10b981;
        }

        .input-field:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .submit-button {
          padding: 12px 24px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: background-color 0.2s;
          white-space: nowrap;
        }

        .submit-button:hover:not(:disabled) {
          background: #059669;
        }

        .submit-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .error-message {
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          border: 1px solid #fecaca;
        }

        .loading-indicator {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid #ffffff;
          border-radius: 50%;
          border-top-color: transparent;
          animation: spin 1s ease-in-out infinite;
          margin-right: 8px;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .examples {
          margin-top: 16px;
          padding: 16px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .examples h4 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #6b7280;
        }

        .example-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .example-chip {
          background: white;
          border: 1px solid #e5e7eb;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          color: #6b7280;
          cursor: pointer;
          transition: all 0.2s;
        }

        .example-chip:hover {
          background: #f3f4f6;
          border-color: #d1d5db;
        }
      `}</style>

      <form onSubmit={handleSubmit} className="input-form">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Tell me what you need... (e.g., Send email to john about meeting)"
          disabled={loading}
          className="input-field"
        />
        <button 
          type="submit" 
          disabled={loading || !input.trim()}
          className="submit-button"
        >
          {loading && <span className="loading-indicator"></span>}
          {loading ? 'Processing...' : 'Generate Preview'}
        </button>
      </form>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {preview && (
        <PreviewCard 
          preview={preview}
          onApprove={handleApprove}
          onReject={handleReject}
          loading={loading}
        />
      )}

      <div className="examples">
        <h4>Try these examples:</h4>
        <div className="example-list">
          <span 
            className="example-chip"
            onClick={() => setInput('Send email to john about meeting tomorrow at 2pm')}
          >
            Send email to john about meeting
          </span>
          <span 
            className="example-chip"
            onClick={() => setInput('Create task to finish Q4 report by Friday')}
          >
            Create task for Q4 report
          </span>
          <span 
            className="example-chip"
            onClick={() => setInput('Remind me to call mom tomorrow at 5pm')}
          >
            Remind me to call mom
          </span>
          <span 
            className="example-chip"
            onClick={() => setInput('How can I be more productive?')}
          >
            How to be more productive?
          </span>
        </div>
      </div>
    </div>
  );
}
