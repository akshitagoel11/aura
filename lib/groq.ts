import Groq from 'groq-sdk';

// Debug: Check if API key is loaded
const apiKey = process.env.GROQ_API_KEY;
console.log('[Groq] API Key loaded:', apiKey ? 'YES' : 'NO');
console.log('[Groq] API Key starts with:', apiKey?.substring(0, 10) + '...');

const groq = new Groq({
  apiKey: apiKey || 'dummy-key',
});

export async function getAIResponse(message: string) {
  try {
    // Check if API key is properly set
    if (!apiKey || apiKey === 'gsk_your-groq-api-key-here') {
      console.log('[Groq] Using fallback - invalid API key');
      // Return a simple response without API call
      return {
        response: "I understand your request. To use AI features, please set a valid GROQ_API_KEY in your environment variables. For now, you can use the manual forms in the Email, Tasks, and Reminders sections."
      };
    }

    console.log('[Groq] Making API call with valid key');
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are an AI productivity assistant. Help users manage emails, tasks, and calendar events through natural language. 

When users ask to send emails, create tasks, or set reminders, respond with structured JSON. Extract the specific details from their message:

For email: {"intent": "send_email", "to": "email@example.com", "subject": "subject", "body": "email body"}
For task: {"intent": "create_task", "title": "task title", "notes": "notes", "due": "YYYY-MM-DD"}
For reminder: {"intent": "create_reminder", "title": "reminder title", "description": "description", "time": "YYYY-MM-DDTHH:mm"}

Examples:
- "Send email to john@example.com about the meeting" → {"intent": "send_email", "to": "john@example.com", "subject": "Meeting", "body": "I wanted to discuss the meeting."}
- "Create task to finish report by Friday" → {"intent": "create_task", "title": "Finish report", "notes": "", "due": "2024-03-15"}
- "Remind me about dentist appointment tomorrow at 3pm" → {"intent": "create_reminder", "title": "Dentist appointment", "description": "Dentist appointment", "time": "2024-03-12T15:00"}

If the user doesn't provide specific details (like email address, exact time), use reasonable defaults based on context.
Otherwise, respond as a helpful assistant with a regular text response.`
        },
        {
          role: "user",
          content: message
        }
      ],
      temperature: 0.5,
      max_tokens: 1024,
    });

    const response = completion.choices[0]?.message?.content || '';
    console.log('[Groq] API response received:', response.substring(0, 100) + '...');
    
    // Try to parse as JSON first
    try {
      return JSON.parse(response);
    } catch {
      return { response };
    }
  } catch (error) {
    console.error('[Groq] API error:', error);
    console.error('[Groq] Error details:', JSON.stringify(error, null, 2));
    
    // Check if it's a Groq API error
    if (error && typeof error === 'object' && 'response' in error) {
      console.error('[Groq] API Response error:', error.response?.data);
    }
    
    return {
      response: "I'm having trouble connecting to my AI services right now. You can still use the manual forms in the sidebar to send emails, create tasks, and set reminders."
    };
  }
}
