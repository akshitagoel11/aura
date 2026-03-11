// src/components/TestIntegration.tsx

import React, { useState } from 'react';
import { auraAIService } from '../services/auraAI.service';

export default function TestIntegration() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const testEmailIntent = async () => {
    setLoading(true);
    try {
      const result = await auraAIService.generatePreview({
        userId: 'test_user_123',
        input: 'Send email to john about meeting tomorrow at 2pm'
      });
      setResults(prev => [...prev, { type: 'Email Preview', data: result, timestamp: new Date().toLocaleTimeString() }]);
    } catch (error: any) {
      setResults(prev => [...prev, { type: 'Email Error', data: error.message, timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  };

  const testTaskIntent = async () => {
    setLoading(true);
    try {
      const result = await auraAIService.generatePreview({
        userId: 'test_user_123',
        input: 'Create task to finish Q4 report by Friday'
      });
      setResults(prev => [...prev, { type: 'Task Preview', data: result, timestamp: new Date().toLocaleTimeString() }]);
    } catch (error: any) {
      setResults(prev => [...prev, { type: 'Task Error', data: error.message, timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  };

  const testReminderIntent = async () => {
    setLoading(true);
    try {
      const result = await auraAIService.generatePreview({
        userId: 'test_user_123',
        input: 'Remind me to call mom tomorrow at 5pm'
      });
      setResults(prev => [...prev, { type: 'Reminder Preview', data: result, timestamp: new Date().toLocaleTimeString() }]);
    } catch (error: any) {
      setResults(prev => [...prev, { type: 'Reminder Error', data: error.message, timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  };

  const testChatIntent = async () => {
    setLoading(true);
    try {
      const result = await auraAIService.generatePreview({
        userId: 'test_user_123',
        input: 'How can I be more productive?'
      });
      setResults(prev => [...prev, { type: 'Chat Preview', data: result, timestamp: new Date().toLocaleTimeString() }]);
    } catch (error: any) {
      setResults(prev => [...prev, { type: 'Chat Error', data: error.message, timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  };

  const testExecution = async (preview: any) => {
    setLoading(true);
    try {
      const result = await auraAIService.executePreview({
        userId: preview.userId,
        intentType: preview.intentType,
        approvedPreview: preview.preview,
        executionId: preview.executionId
      });
      setResults(prev => [...prev, { type: 'Execution Result', data: result, timestamp: new Date().toLocaleTimeString() }]);
    } catch (error: any) {
      setResults(prev => [...prev, { type: 'Execution Error', data: error.message, timestamp: new Date().toLocaleTimeString() }]);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="test-integration">
      <style jsx>{`
        .test-integration {
          max-width: 1200px;
          margin: 20px auto;
          padding: 20px;
        }

        .test-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .test-buttons {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 30px;
        }

        .test-button {
          padding: 12px 16px;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: background-color 0.2s;
        }

        .test-button:hover:not(:disabled) {
          background: #2563eb;
        }

        .test-button:disabled {
          background: #9ca3af;
          cursor: not-allowed;
        }

        .clear-button {
          background: #ef4444;
          grid-column: 1 / -1;
        }

        .clear-button:hover:not(:disabled) {
          background: #dc2626;
        }

        .results {
          margin-top: 20px;
        }

        .result-item {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 12px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .result-type {
          font-weight: 600;
          color: #1f2937;
        }

        .result-timestamp {
          font-size: 12px;
          color: #6b7280;
        }

        .result-content {
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          font-family: monospace;
          font-size: 12px;
          white-space: pre-wrap;
          max-height: 300px;
          overflow-y: auto;
        }

        .execute-button {
          margin-top: 8px;
          padding: 4px 8px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
        }

        .execute-button:hover {
          background: #059669;
        }
      `}</style>

      <div className="test-header">
        <h2>🧪 Aura AI Integration Test</h2>
        <p>Test the n8n workflow integration with your frontend</p>
      </div>

      <div className="test-buttons">
        <button 
          onClick={testEmailIntent} 
          disabled={loading}
          className="test-button"
        >
          📧 Test Email Intent
        </button>
        <button 
          onClick={testTaskIntent} 
          disabled={loading}
          className="test-button"
        >
          ✅ Test Task Intent
        </button>
        <button 
          onClick={testReminderIntent} 
          disabled={loading}
          className="test-button"
        >
          ⏰ Test Reminder Intent
        </button>
        <button 
          onClick={testChatIntent} 
          disabled={loading}
          className="test-button"
        >
          💬 Test Chat Intent
        </button>
        <button 
          onClick={clearResults} 
          disabled={loading}
          className="test-button clear-button"
        >
          🗑️ Clear Results
        </button>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div>⏳ Testing integration...</div>
        </div>
      )}

      <div className="results">
        <h3>Test Results:</h3>
        {results.length === 0 ? (
          <p>No tests run yet. Click the buttons above to test the integration.</p>
        ) : (
          results.map((result, index) => (
            <div key={index} className="result-item">
              <div className="result-header">
                <span className="result-type">{result.type}</span>
                <span className="result-timestamp">{result.timestamp}</span>
              </div>
              <div className="result-content">
                {typeof result.data === 'object' 
                  ? JSON.stringify(result.data, null, 2)
                  : result.data
                }
              </div>
              {result.data?.success && result.data?.intentType && (
                <button 
                  onClick={() => testExecution(result.data)}
                  className="execute-button"
                >
                  🚀 Execute This Preview
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
