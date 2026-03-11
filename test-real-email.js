// Test real email service
const { sendRealEmailNow } = require('./lib/email-service.js');

async function testRealEmail() {
  console.log('🧪 Testing REAL Email Service...');
  
  try {
    const result = await sendRealEmailNow({
      to: ['your-email@gmail.com'], // Replace with your actual email
      subject: '🎉 REAL Test Email from Aura AI',
      body: 'This is a REAL test email sent by Aura AI using SMTP. If you receive this, the email service is working!',
      priority: 'high'
    });
    
    console.log('✅ Email test result:', result);
    
    if (result.success) {
      console.log('🎉 SUCCESS! Check your Gmail inbox!');
      console.log('📧 Message ID:', result.messageId);
    } else {
      console.log('❌ Email failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRealEmail();
