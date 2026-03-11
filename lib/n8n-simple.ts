const N8N_WEBHOOK_BASE = 'https://n8n.mediajade.com/webhook';

// Process preview data to ensure proper date formatting for n8n
function processPreviewForExecution(preview: any, intentType: string): any {
  if (!preview) return preview;
  
  const processed = { ...preview };
  
  // Handle task dates - preserve exact time if provided
  if (intentType === 'task') {
    if (preview.scheduledDate && !preview.scheduledDate.includes('2023')) {
      processed.scheduledDate = preview.scheduledDate;
    } else {
      // Use current date with preserved time or default to 9am tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      processed.scheduledDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    // Preserve exact time if provided
    if (preview.scheduledTime) {
      processed.scheduledTime = preview.scheduledTime;
    } else if (preview.time) {
      processed.scheduledTime = preview.time;
    } else {
      processed.scheduledTime = '09:00';
    }
  }
  
  // Handle reminder dates - preserve exact time if provided
  if (intentType === 'reminder') {
    if (preview.reminderTime && !preview.reminderTime.includes('2023')) {
      processed.reminderTime = preview.reminderTime;
    } else if (preview.time && !preview.time.includes('2023')) {
      processed.reminderTime = preview.time;
    } else {
      // Use tomorrow at the exact time mentioned or default to 9am
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      processed.reminderTime = tomorrow.toISOString();
    }
  }
  
  return processed;
}

export async function generateIntentPreview(
  userId: string, 
  intent: string, 
  intentType: string,
  regenerate: boolean = false,
  previousDraft: string | null = null
) {
  try {
    console.log('[N8N] Generating preview for intent:', intent, 'type:', intentType, 'regenerate:', regenerate);
    
    const requestBody = {
      userId,
      intent,
      intentType,
      regenerate,
      previousDraft,
      timestamp: new Date().toISOString()
    };
    
    const response = await fetch(`${N8N_WEBHOOK_BASE}/ai-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error('[N8N] Preview generation failed:', response.status, response.statusText);
      return null;
    }

    const result = await response.json();
    console.log('[N8N] Preview generated successfully:', result);
    
    return result;
  } catch (error) {
    console.error('[N8N] Error generating preview:', error);
    return null;
  }
}

export async function executeIntent(userId: string, intent: string, intentType: string, approvedPreview?: any) {
  try {
    console.log('[N8N] Executing intent:', intent, 'type:', intentType, 'preview:', approvedPreview);
    
    // Process the preview to ensure proper dates
    const processedPreview = processPreviewForExecution(approvedPreview, intentType);
    
    const requestBody = {
      userId,
      intent,
      intentType,
      approvedPreview: processedPreview,
      executionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };
    
    console.log('[N8N] Request body:', JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`${N8N_WEBHOOK_BASE}/ai-execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[N8N] Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error('[N8N] Intent execution failed:', response.status, response.statusText);
      return {
        success: false,
        error: `Execution failed: ${response.statusText}`
      };
    }

    // Handle empty response from n8n (workflow might be running but not returning JSON)
    const responseText = await response.text();
    console.log('[N8N] Raw response text:', responseText);
    
    let result;
    if (responseText.trim() === '') {
      // Empty response - assume execution was successful but n8n didn't return JSON
      console.log('[N8N] Empty response received, assuming success');
      result = {
        success: true,
        message: 'Execution completed (no response from n8n)',
        executionId: requestBody.executionId
      };
    } else {
      try {
        result = JSON.parse(responseText);
        console.log('[N8N] Intent executed successfully:', result);
      } catch (parseError) {
        console.log('[N8N] Failed to parse JSON response:', parseError instanceof Error ? parseError.message : 'Unknown error');
        // Return success anyway since the workflow was triggered
        result = {
          success: true,
          message: 'Execution completed (invalid JSON response)',
          rawResponse: responseText,
          executionId: requestBody.executionId
        };
      }
    }
    
    return {
      success: true,
      executionId: result.executionId || requestBody.executionId,
      result: result
    };
  } catch (error) {
    console.error('[N8N] Error executing intent:', error);
    console.error('[N8N] Error details:', error instanceof Error ? error.stack : 'Unknown error');
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'No details available'
    };
  }
}
