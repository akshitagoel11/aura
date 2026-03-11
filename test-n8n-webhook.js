// Test script to verify n8n webhook functionality

async function testN8nWebhook() {
  console.log('🧪 Testing n8n webhook endpoints...');
  
  const N8N_WEBHOOK_BASE = 'https://n8n.mediajade.com/webhook';
  
  // Test 1: Preview generation
  console.log('\n📝 Testing preview generation...');
  try {
    const previewResponse = await fetch(`${N8N_WEBHOOK_BASE}/ai-preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: 'test_user_123',
        intent: 'Send email to john about meeting tomorrow',
        intentType: 'email',
        timestamp: new Date().toISOString()
      }),
    });

    console.log('Preview response status:', previewResponse.status, previewResponse.statusText);
    
    if (previewResponse.ok) {
      const previewResult = await previewResponse.json();
      console.log('✅ Preview generation successful!');
      console.log('Preview data:', JSON.stringify(previewResult, null, 2));
      
      // Test 2: Execution with the preview data
      console.log('\n⚡ Testing execution...');
      try {
        const executeResponse = await fetch(`${N8N_WEBHOOK_BASE}/ai-execute`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: 'test_user_123',
            intent: 'Send email to john about meeting tomorrow',
            intentType: 'email',
            approvedPreview: previewResult.preview,
            executionId: `exec_${Date.now()}_test`,
            timestamp: new Date().toISOString()
          }),
        });

        console.log('Execute response status:', executeResponse.status, executeResponse.statusText);
        
        if (executeResponse.ok) {
          const responseText = await executeResponse.text();
          console.log('Raw response text:', responseText);
          
          // Handle empty response like our fixed n8n-simple.ts
          if (responseText.trim() === '') {
            console.log('✅ Execution successful! (Empty response from n8n - workflow triggered)');
            console.log('📧 Email should be sent to Gmail');
            console.log('📋 Check your Gmail inbox for the email');
          } else {
            try {
              const executeResult = JSON.parse(responseText);
              console.log('✅ Execution successful!');
              console.log('Execution result:', JSON.stringify(executeResult, null, 2));
            } catch (parseError) {
              console.log('✅ Execution completed! (Invalid JSON but workflow triggered)');
              console.log('📧 Email should be sent to Gmail');
              console.log('📋 Check your Gmail inbox for the email');
            }
          }
        } else {
          const errorText = await executeResponse.text();
          console.log('❌ Execution failed:', errorText);
        }
      } catch (execError) {
        console.log('❌ Execution error:', execError.message);
      }
    } else {
      const errorText = await previewResponse.text();
      console.log('❌ Preview generation failed:', errorText);
    }
  } catch (previewError) {
    console.log('❌ Preview error:', previewError.message);
  }
  
  console.log('\n🎯 Test completed!');
  console.log('📝 Note: If execution shows success, check your Gmail/GTasks/Calendar for the actual results');
}

// Run the test
testN8nWebhook().catch(console.error);
