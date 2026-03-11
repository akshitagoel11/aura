// Test exact time parsing with n8n
const { generateIntentPreview } = require('./lib/n8n-simple.ts');

async function testExactTimeWithN8N() {
  console.log('🧪 Testing exact time parsing with n8n...');
  
  const testCases = [
    'Set reminder for team meeting tomorrow at 8pm',
    'Create task for project review tomorrow at 2:30pm',
    'Set reminder for doctor appointment tomorrow at 9am',
    'Create task for call with client tomorrow at 6:15pm'
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📝 Testing: "${testCase}"`);
    
    try {
      const result = await generateIntentPreview('test_user_123', testCase, testCase.includes('reminder') ? 'reminder' : 'task');
      
      if (result && result.preview) {
        console.log('✅ Preview generated:');
        console.log('  Title:', result.preview.title);
        console.log('  Message:', result.preview.message);
        console.log('  Time:', result.preview.reminderTime || result.preview.scheduledTime);
        console.log('  Type:', result.preview.reminderType || result.preview.type);
      } else {
        console.log('❌ No preview generated');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }
  }
}

testExactTimeWithN8N();
