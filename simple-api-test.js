// Simple API test
async function testApi() {
  console.log('🧪 Testing API endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session_token=test_session_123'
      },
      body: JSON.stringify({
        intent: 'Send email to john about meeting tomorrow',
        intentType: 'email',
        preview: {
          to: ['john@example.com'],
          subject: 'Test Email',
          body: 'Test email body',
          priority: 'normal'
        }
      }),
    });

    console.log('API Response status:', response.status);
    const responseText = await response.text();
    console.log('Raw API response:', responseText);
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testApi();
