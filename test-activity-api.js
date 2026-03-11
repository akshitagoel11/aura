// Simple test to check if activity API works
async function testActivityAPI() {
  try {
    console.log('Testing activity API...');
    
    // Test the API endpoint directly
    const response = await fetch('http://localhost:3000/api/activity', {
      headers: {
        'Cookie': 'session_token=test'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Activity data:', JSON.stringify(data, null, 2));
    } else {
      console.error('API Error:', response.statusText);
    }
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Run if server is running
testActivityAPI();
