// Debug n8n execution to see what data is being sent
const { executeIntent } = require('./lib/n8n-simple.ts');

async function debugN8nExecution() {
  console.log('🔍 Debugging n8n execution...');
  
  try {
    // Test with real email data
    const result = await executeIntent(
      'debug_user_123',
      'Send email to your-email@gmail.com about test meeting',
      'email',
      {
        to: ['your-email@gmail.com'], // Use your actual email
        subject: '🔍 DEBUG: Test Email from Aura AI',
        body: 'This is a DEBUG test email to verify n8n workflow is working. If you receive this, the n8n workflow is properly configured!',
        priority: 'high'
      }
    );
    
    console.log('📊 Execution result:', result);
    
    if (result.success) {
      console.log('✅ n8n workflow triggered successfully!');
      console.log('📧 Check your Gmail for the debug email');
      console.log('🔍 If no email arrives, the issue is in your n8n workflow configuration');
    } else {
      console.log('❌ n8n execution failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
  }
}

debugN8nExecution();
