// Test working email service
const { sendWorkingEmail } = require('./lib/working-email-service.js');

async function testWorkingEmail() {
  console.log('🧪 Testing Working Email Service...');
  
  try {
    const result = await sendWorkingEmail({
      to: ['your-email@gmail.com'], // Replace with your actual email
      subject: '🎉 WORKING Test Email from Aura AI',
      body: 'This is a WORKING test email sent by Aura AI. The service is now functional!',
      priority: 'high'
    });
    
    console.log('✅ Email test result:', result);
    
    if (result.success) {
      console.log('🎉 SUCCESS! Email service is working!');
      console.log('📧 Message ID:', result.messageId);
      console.log('📧 Delivery Status:', result.deliveryStatus);
    } else {
      console.log('❌ Email failed:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testWorkingEmail();
