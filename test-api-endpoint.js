// Test the API endpoint directly
const fetch = require('undici');

async function testApiEndpoint() {
  console.log('🧪 Testing API endpoint...');
  
  try {
    const response = await fetch('http://localhost:3000/api/ai/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': 'session_token=test_session_123' // Mock session
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

    console.log('API Response status:', response.status, response.statusText);
    
    const responseText = await response.text();
    console.log('Raw API response:', responseText);
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ API Response parsed:', result);
    } catch (parseError) {
      console.log('❌ Failed to parse API response:', parseError.message);
      console.log('Response was:', responseText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

testApiEndpoint();
