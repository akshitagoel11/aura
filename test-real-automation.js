// Test real automation
const { executeRealAutomation } = require('./lib/real-automation.ts');

async function testRealAutomation() {
  console.log('🧪 Testing REAL Automation...');
  
  // Test email execution
  console.log('\n📧 Testing REAL email execution...');
  const emailResult = await executeRealAutomation(
    'test_user_123',
    'email',
    {
      to: ['your-email@gmail.com'], // Replace with your actual email
      subject: '🎉 REAL Test Email from Aura AI',
      body: 'This is a REAL test email sent by Aura AI automation. Check your Gmail inbox!',
      priority: 'high'
    }
  );
  console.log('Email result:', emailResult);
  
  // Test task execution
  console.log('\n📋 Testing REAL task execution...');
  const taskResult = await executeRealAutomation(
    'test_user_123',
    'task',
    {
      title: '🎯 REAL Test Task from Aura AI',
      description: 'This is a REAL test task created by Aura AI. Check your Google Tasks!',
      scheduledDate: '2026-02-25',
      priority: 'high'
    }
  );
  console.log('Task result:', taskResult);
  
  // Test reminder execution
  console.log('\n📅 Testing REAL reminder execution...');
  const reminderResult = await executeRealAutomation(
    'test_user_123',
    'reminder',
    {
      title: '📅 REAL Test Reminder from Aura AI',
      message: 'This is a REAL test reminder created by Aura AI. Check your Google Calendar!',
      reminderTime: '2026-02-25T10:00:00Z',
      reminderType: 'notification'
    }
  );
  console.log('Reminder result:', reminderResult);
  
  console.log('\n🎉 REAL Automation Test Completed!');
  console.log('📧 Check your Gmail, Google Tasks, and Google Calendar!');
}

testRealAutomation().catch(console.error);
