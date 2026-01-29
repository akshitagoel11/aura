'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface IntentPreviewProps {
  preview: string;
  intentType: string;
  loading: boolean;
  onConfirm: () => void;
  onEdit: () => void;
}

export default function IntentPreview({ preview, intentType, loading, onConfirm, onEdit }: IntentPreviewProps) {
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
          <p className="text-foreground whitespace-pre-wrap">{preview}</p>
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
