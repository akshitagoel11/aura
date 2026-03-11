// Add test activity to verify real-time updates
async function addTestActivity() {
  try {
    console.log('Adding test activity...');
    
    // Add a test email activity
    const emailResponse = await fetch('http://localhost:3000/api/ai/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session_token=test'
      },
      body: JSON.stringify({
        intent: 'Send test email for real-time verification',
        intentType: 'email',
        preview: {
          to: 'test@example.com',
          subject: 'Real-time Test Email',
          body: 'This is a test email to verify real-time activity updates are working.'
        }
      })
    });
    
    console.log('Email execution status:', emailResponse.status);
    
    if (emailResponse.ok) {
      const result = await emailResponse.json();
      console.log('Email result:', result);
    } else {
      console.error('Email execution failed:', await emailResponse.text());
    }
    
    // Add a test task
    const taskResponse = await fetch('http://localhost:3000/api/ai/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session_token=test'
      },
      body: JSON.stringify({
        intent: 'Create test task for real-time verification',
        intentType: 'task',
        preview: {
          title: 'Test Real-time Task',
          description: 'This is a test task to verify real-time activity updates.',
          priority: 'high'
        }
      })
    });
    
    console.log('Task execution status:', taskResponse.status);
    
    if (taskResponse.ok) {
      const result = await taskResponse.json();
      console.log('Task result:', result);
    } else {
      console.error('Task execution failed:', await taskResponse.text());
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Wait a bit for server to start, then run test
setTimeout(addTestActivity, 3000);
