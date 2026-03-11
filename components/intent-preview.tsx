'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { parseRelativeDate, formatDateForDisplay, formatTimeForDisplay, isValidDate } from '../src/utils/dateUtils';

interface IntentPreviewProps {
  preview: any;
  intentType: string;
  loading: boolean;
  onConfirm: () => void;
  onEdit: () => void;
}

export default function IntentPreview({ preview, intentType, loading, onConfirm, onEdit }: IntentPreviewProps) {
  console.log('[IntentPreview] Intent type:', intentType, 'Preview data:', preview);
  
  const renderPreviewContent = () => {
    if (!preview) return null;

    switch (intentType) {
      case 'email':
        return (
          <div className="space-y-3">
            <div>
              <span className="font-medium text-sm text-muted-foreground">To:</span>
              <p className="text-foreground">{preview.to?.join(', ') || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-sm text-muted-foreground">Subject:</span>
              <p className="text-foreground">{preview.subject || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-sm text-muted-foreground">Body:</span>
              <p className="text-foreground whitespace-pre-wrap">{preview.body || 'N/A'}</p>
            </div>
            {preview.cc?.length > 0 && (
              <div>
                <span className="font-medium text-sm text-muted-foreground">CC:</span>
                <p className="text-foreground">{preview.cc.join(', ')}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-sm text-muted-foreground">Priority:</span>
              <span className={`inline-block px-2 py-1 text-xs rounded ${
                preview.priority === 'high' ? 'bg-red-100 text-red-800' :
                preview.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {preview.priority || 'normal'}
              </span>
            </div>
          </div>
        );

      case 'task':
        // Parse the date from various fields
        let taskDate: Date | null = null;
        
        if (preview.scheduledDate) {
          taskDate = parseRelativeDate(preview.scheduledDate);
        } else if (preview.dueDate) {
          taskDate = parseRelativeDate(preview.dueDate);
        } else if (preview.date) {
          taskDate = parseRelativeDate(preview.date);
        }
        
        // If no valid date, use tomorrow as default
        if (!taskDate || !isValidDate(taskDate)) {
          taskDate = new Date();
          taskDate.setDate(taskDate.getDate() + 1);
        }
        
        return (
          <div className="space-y-3">
            <div>
              <span className="font-medium text-sm text-muted-foreground">Task:</span>
              <p className="text-foreground">{preview.title || preview.task || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-sm text-muted-foreground">Description:</span>
              <p className="text-foreground">{preview.description || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-sm text-muted-foreground">Due Date:</span>
              <p className="text-foreground">
                {formatDateForDisplay(taskDate)} at {preview.scheduledTime || '9:00 AM'}
              </p>
            </div>
            <div>
              <span className="font-medium text-sm text-muted-foreground">Priority:</span>
              <span className={`inline-block px-2 py-1 text-xs rounded ${
                preview.priority === 'high' ? 'bg-red-100 text-red-800' :
                preview.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'
              }`}>
                {preview.priority || 'normal'}
              </span>
            </div>
            {preview.estimatedDuration && (
              <div>
                <span className="font-medium text-sm text-muted-foreground">Duration:</span>
                <p className="text-foreground">{preview.estimatedDuration}</p>
              </div>
            )}
          </div>
        );

      case 'reminder':
        console.log('[IntentPreview] Reminder preview data:', preview);
        console.log('[IntentPreview] Reminder fields:', {
          title: preview.title,
          message: preview.message,
          description: preview.description,
          reminderTime: preview.reminderTime,
          time: preview.time,
          date: preview.date,
          reminderType: preview.reminderType,
          type: preview.type
        });
        
        // Parse reminder date from various fields
        let reminderDate: Date | null = null;
        
        if (preview.reminderTime) {
          reminderDate = parseRelativeDate(preview.reminderTime);
          console.log('[IntentPreview] Parsed reminderTime:', reminderDate);
        } else if (preview.time) {
          reminderDate = parseRelativeDate(preview.time);
          console.log('[IntentPreview] Parsed time:', reminderDate);
        } else if (preview.date) {
          reminderDate = parseRelativeDate(preview.date);
          console.log('[IntentPreview] Parsed date:', reminderDate);
        }
        
        // If no valid date or date is too old, use tomorrow as default
        if (!reminderDate || !isValidDate(reminderDate) || reminderDate.getFullYear() < 2025) {
          console.log('[IntentPreview] Using default date (tomorrow)');
          reminderDate = new Date();
          reminderDate.setDate(reminderDate.getDate() + 1);
        }
        
        return (
          <div className="space-y-3">
            <div>
              <span className="font-medium text-sm text-muted-foreground">Title:</span>
              <p className="text-foreground">{preview.title || preview.message || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-sm text-muted-foreground">Message:</span>
              <p className="text-foreground">{preview.message || preview.description || 'N/A'}</p>
            </div>
            <div>
              <span className="font-medium text-sm text-muted-foreground">Time:</span>
              <p className="text-foreground">
                {formatDateForDisplay(reminderDate)} at {formatTimeForDisplay(reminderDate)}
              </p>
            </div>
            <div>
              <span className="font-medium text-sm text-muted-foreground">Type:</span>
              <p className="text-foreground">{preview.reminderType || preview.type || 'notification'}</p>
            </div>
            {preview.repeat && preview.repeat !== 'none' && (
              <div>
                <span className="font-medium text-sm text-muted-foreground">Repeat:</span>
                <p className="text-foreground">{preview.repeat}</p>
              </div>
            )}
          </div>
        );

      case 'chat':
        return (
          <div className="space-y-3">
            <div>
              <span className="font-medium text-sm text-muted-foreground">Response:</span>
              <p className="text-foreground whitespace-pre-wrap">{preview.response || 'N/A'}</p>
            </div>
            {preview.suggestedActions?.length > 0 && (
              <div>
                <span className="font-medium text-sm text-muted-foreground">Suggested Actions:</span>
                <ul className="list-disc list-inside text-foreground">
                  {preview.suggestedActions.map((action: string, idx: number) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </div>
            )}
            {preview.followUpQuestions?.length > 0 && (
              <div>
                <span className="font-medium text-sm text-muted-foreground">Follow-up Questions:</span>
                <ul className="list-disc list-inside text-foreground">
                  {preview.followUpQuestions.map((question: string, idx: number) => (
                    <li key={idx}>{question}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );

      default:
        return <p className="text-foreground">Unknown intent type</p>;
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Preview Title */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">Preview</h3>
        <div className="text-xs text-muted-foreground mb-3">
          {intentType.charAt(0).toUpperCase() + intentType.slice(1)} • Auto-generated
        </div>
      </div>

      {/* Preview Content */}
      <Card className="border-primary/20 bg-primary/5 p-6 space-y-4">
        <div className="prose prose-invert prose-sm max-w-none">
          {renderPreviewContent()}
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <Button onClick={onEdit} variant="outline" className="flex-1 border-border text-foreground hover:bg-muted bg-transparent">
          Edit
        </Button>
        <Button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {loading ? 'Executing...' : 'Confirm & Execute'}
        </Button>
      </div>

      {/* Confirmation Message */}
      {loading && (
        <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
          <p className="text-sm text-accent-foreground">
            <span className="inline-block animate-spin mr-2">↻</span>
            Processing your request...
          </p>
        </div>
      )}
    </div>
  );
}
