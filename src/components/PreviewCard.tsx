// src/components/PreviewCard.tsx

import React from 'react';

interface PreviewCardProps {
  preview: any;
  onApprove: () => void;
  onReject: () => void;
  loading: boolean;
}

export default function PreviewCard({ preview, onApprove, onReject, loading }: PreviewCardProps) {
  const renderPreviewContent = () => {
    switch (preview.intentType) {
      case 'email':
        return (
          <div className="email-preview">
            <div className="preview-field">
              <strong>To:</strong> {preview.preview.to.join(', ')}
            </div>
            <div className="preview-field">
              <strong>Subject:</strong> {preview.preview.subject}
            </div>
            <div className="preview-field">
              <strong>Body:</strong>
              <div className="email-body">{preview.preview.body}</div>
            </div>
            {preview.preview.cc?.length > 0 && (
              <div className="preview-field">
                <strong>CC:</strong> {preview.preview.cc.join(', ')}
              </div>
            )}
            {preview.preview.bcc?.length > 0 && (
              <div className="preview-field">
                <strong>BCC:</strong> {preview.preview.bcc.join(', ')}
              </div>
            )}
            <div className="preview-field">
              <strong>Priority:</strong> 
              <span className={`priority-badge ${preview.preview.priority}`}>
                {preview.preview.priority}
              </span>
            </div>
            <div className="preview-field">
              <strong>Estimated Time:</strong> {preview.preview.estimatedTime}
            </div>
          </div>
        );

      case 'task':
        return (
          <div className="task-preview">
            <div className="preview-field">
              <strong>Task:</strong> {preview.preview.title}
            </div>
            <div className="preview-field">
              <strong>Description:</strong> {preview.preview.description}
            </div>
            <div className="preview-field">
              <strong>Due Date:</strong> {preview.preview.scheduledDate} at {preview.preview.scheduledTime}
            </div>
            <div className="preview-field">
              <strong>Priority:</strong> 
              <span className={`priority-badge ${preview.preview.priority}`}>
                {preview.preview.priority}
              </span>
            </div>
            <div className="preview-field">
              <strong>Estimated Duration:</strong> {preview.preview.estimatedDuration}
            </div>
            {preview.preview.attendees?.length > 0 && (
              <div className="preview-field">
                <strong>Attendees:</strong> {preview.preview.attendees.join(', ')}
              </div>
            )}
            {preview.preview.location && (
              <div className="preview-field">
                <strong>Location:</strong> {preview.preview.location}
              </div>
            )}
            <div className="preview-field">
              <strong>Time Flexible:</strong> {preview.preview.isTimeFlexible ? 'Yes' : 'No'}
            </div>
          </div>
        );

      case 'reminder':
        return (
          <div className="reminder-preview">
            <div className="preview-field">
              <strong>Title:</strong> {preview.preview.title}
            </div>
            <div className="preview-field">
              <strong>Message:</strong> {preview.preview.message}
            </div>
            <div className="preview-field">
              <strong>Time:</strong> {new Date(preview.preview.reminderTime).toLocaleString()}
            </div>
            <div className="preview-field">
              <strong>Type:</strong> {preview.preview.reminderType}
            </div>
            <div className="preview-field">
              <strong>Priority:</strong> 
              <span className={`priority-badge ${preview.preview.priority}`}>
                {preview.preview.priority}
              </span>
            </div>
            {preview.preview.repeat !== 'none' && (
              <div className="preview-field">
                <strong>Repeat:</strong> {preview.preview.repeat}
              </div>
            )}
          </div>
        );

      case 'chat':
        return (
          <div className="chat-preview">
            <div className="preview-field">
              <strong>Response:</strong>
              <p>{preview.preview.response}</p>
            </div>
            {preview.preview.suggestedActions?.length > 0 && (
              <div className="preview-field">
                <strong>Suggested Actions:</strong>
                <ul>
                  {preview.preview.suggestedActions.map((action: string, idx: number) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            {preview.preview.followUpQuestions?.length > 0 && (
              <div className="preview-field">
                <strong>Follow-up Questions:</strong>
                <ul>
                  {preview.preview.followUpQuestions.map((question: string, idx: number) => (
                    <li key={idx}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
            {preview.preview.requiresAction !== undefined && (
              <div className="preview-field">
                <strong>Requires Action:</strong> {preview.preview.requiresAction ? 'Yes' : 'No'}
              </div>
            )}
          </div>
        );

      default:
        return <div>Unknown intent type</div>;
    }
  };

  return (
    <div className="preview-card">
      <style jsx>{`
        .preview-card {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 12px;
          padding: 20px;
          margin-top: 16px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          max-width: 600px;
        }

        .preview-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e5e7eb;
        }

        .preview-header h3 {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .confidence-score {
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }

        .preview-content {
          margin-bottom: 16px;
        }

        .preview-field {
          margin-bottom: 12px;
          line-height: 1.5;
        }

        .preview-field strong {
          color: #374151;
          margin-right: 8px;
        }

        .email-body {
          background: #f9fafb;
          padding: 12px;
          border-radius: 6px;
          margin-top: 4px;
          white-space: pre-wrap;
          font-family: monospace;
          font-size: 14px;
        }

        .priority-badge {
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
          margin-left: 8px;
        }

        .priority-badge.high {
          background: #fef2f2;
          color: #dc2626;
        }

        .priority-badge.medium {
          background: #fef3c7;
          color: #d97706;
        }

        .priority-badge.low {
          background: #f0fdf4;
          color: #16a34a;
        }

        .priority-badge.normal {
          background: #f0fdf4;
          color: #16a34a;
        }

        .preview-footer {
          border-top: 1px solid #e5e7eb;
          padding-top: 16px;
        }

        .ai-reasoning {
          background: #f3f4f6;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
          color: #4b5563;
        }

        .preview-actions {
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }

        .btn-reject, .btn-approve {
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-reject {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-reject:hover:not(:disabled) {
          background: #e5e7eb;
        }

        .btn-approve {
          background: #10b981;
          color: white;
        }

        .btn-approve:hover:not(:disabled) {
          background: #059669;
        }

        .btn-reject:disabled, .btn-approve:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        ul {
          margin: 4px 0 0 20px;
          padding: 0;
        }

        li {
          margin-bottom: 4px;
          color: #4b5563;
        }
      `}</style>

      <div className="preview-header">
        <h3>AI Generated Preview</h3>
        <div className="confidence-score">
          Confidence: {(preview.confidence * 100).toFixed(0)}%
        </div>
      </div>

      <div className="preview-content">
        {renderPreviewContent()}
      </div>

      <div className="preview-footer">
        <div className="ai-reasoning">
          <strong>AI Reasoning:</strong> {preview.reasoning}
        </div>
        
        <div className="preview-actions">
          <button 
            onClick={onReject} 
            className="btn-reject"
            disabled={loading}
          >
            Reject
          </button>
          <button 
            onClick={onApprove} 
            className="btn-approve"
            disabled={loading}
          >
            {loading ? 'Executing...' : 'Approve & Execute'}
          </button>
        </div>
      </div>
    </div>
  );
}
