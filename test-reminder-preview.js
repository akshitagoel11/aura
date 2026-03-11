// Test reminder preview data from n8n
const { generateIntentPreview } = require('./lib/n8n-simple.ts');

async function testReminderPreview() {
  console.log('🧪 Testing reminder preview from n8n...');
  
  try {
    const result = await generateIntentPreview(
      'test_user_123',
      'Set reminder for team meeting tomorrow at 2pm',
      'reminder'
    );
    
    console.log('📝 Reminder preview result:', JSON.stringify(result, null, 2));
    
    if (result && result.preview) {
      console.log('📋 Preview fields:');
      console.log('  title:', result.preview.title);
      console.log('  message:', result.preview.message);
      console.log('  description:', result.preview.description);
      console.log('  reminderTime:', result.preview.reminderTime);
      console.log('  time:', result.preview.time);
      console.log('  date:', result.preview.date);
      console.log('  reminderType:', result.preview.reminderType);
      console.log('  type:', result.preview.type);
    } else {
      console.log('❌ No preview data received');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testReminderPreview();
