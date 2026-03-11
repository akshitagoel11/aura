// Test login API directly
async function testLoginAPI() {
  console.log('🧪 Testing Login API...');
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword'
      }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);
    
    if (responseText.startsWith('<!DOCTYPE')) {
      console.log('❌ Got HTML instead of JSON - API route not found!');
      console.log('📝 This means the app is not running or routes are broken');
    } else {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ API Response:', result);
      } catch (parseError) {
        console.log('❌ Failed to parse JSON:', parseError.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testLoginAPI();
