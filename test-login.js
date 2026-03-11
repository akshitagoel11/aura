// Test login and activity
async function testLoginAndActivity() {
  try {
    console.log('Testing login...');
    
    // First login to get a session
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginResult = await loginResponse.json();
      console.log('Login successful:', loginResult);
      
      // Extract session token from cookies
      const setCookieHeader = loginResponse.headers.get('set-cookie');
      console.log('Set-Cookie:', setCookieHeader);
      
      if (setCookieHeader) {
        const sessionToken = setCookieHeader.split('session_token=')[1]?.split(';')[0];
        console.log('Session token:', sessionToken);
        
        // Now test activity with valid session
        const activityResponse = await fetch('http://localhost:3000/api/activity', {
          headers: {
            'Cookie': `session_token=${sessionToken}`
          }
        });
        
        console.log('Activity status:', activityResponse.status);
        
        if (activityResponse.ok) {
          const activityData = await activityResponse.json();
          console.log('Activity data:', JSON.stringify(activityData, null, 2));
        } else {
          console.error('Activity API failed:', await activityResponse.text());
        }
        
        // Add test activity
        const executeResponse = await fetch('http://localhost:3000/api/ai/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': `session_token=${sessionToken}`
          },
          body: JSON.stringify({
            intent: 'Send real-time test email',
            intentType: 'email',
            preview: {
              to: 'test@example.com',
              subject: 'Real-time Test',
              body: 'Testing real-time updates'
            }
          })
        });
        
        console.log('Execute status:', executeResponse.status);
        
        if (executeResponse.ok) {
          const executeResult = await executeResponse.json();
          console.log('Execute result:', executeResult);
        } else {
          console.error('Execute failed:', await executeResponse.text());
        }
      }
    } else {
      console.error('Login failed:', await loginResponse.text());
    }
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

// Wait for server to be ready
setTimeout(testLoginAndActivity, 2000);
