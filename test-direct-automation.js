// Test script for direct automation
const { executeDirectAutomation } = require('./lib/direct-automation.ts');

async function testDirectAutomation() {
  console.log('🧪 Testing Direct Automation...');
  
  // Test email execution
  console.log('\n📧 Testing email execution...');
  const emailResult = await executeDirectAutomation(
    'test_user_123',
    'email',
    {
      to: ['john@example.com'],
      subject: 'Test Email from Direct Automation',
      body: 'This is a test email sent via direct automation.',
      priority: 'normal'
    }
  );
  console.log('Email result:', emailResult);
  
  // Test task execution
  console.log('\n📋 Testing task execution...');
  const taskResult = await executeDirectAutomation(
    'test_user_123',
    'task',
    {
      title: 'Test Task from Direct Automation',
      description: 'This is a test task created via direct automation.',
      scheduledDate: '2026-02-25',
      priority: 'medium'
    }
  );
  console.log('Task result:', taskResult);
  
  // Test reminder execution
  console.log('\n📅 Testing reminder execution...');
  const reminderResult = await executeDirectAutomation(
    'test_user_123',
    'reminder',
    {
      title: 'Test Reminder from Direct Automation',
      message: 'This is a test reminder created via direct automation.',
      reminderTime: '2026-02-25T09:00:00Z',
      reminderType: 'notification'
    }
  );
  console.log('Reminder result:', reminderResult);
  
  // Test chat execution
  console.log('\n💬 Testing chat execution...');
  const chatResult = await executeDirectAutomation(
    'test_user_123',
    'chat',
    {
      response: 'This is a test chat response from direct automation.',
      suggestedActions: ['Check email', 'Review tasks']
    }
  );
  console.log('Chat result:', chatResult);
  
  console.log('\n🎯 Direct Automation Test Completed!');
}

testDirectAutomation().catch(console.error);
