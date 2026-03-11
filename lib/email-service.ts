// Real email service that actually sends emails
const nodemailer = require('nodemailer');

// Configure a real email transporter
// For production, you'd use Gmail SMTP with OAuth2 or a service like SendGrid
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com',
    pass: process.env.GMAIL_PASS || 'your-app-password'
  }
});

async function sendRealEmailNow(emailData: any) {
  try {
    console.log('📧 Sending REAL email via SMTP:', emailData.to);
    
    const mailOptions = {
      from: process.env.GMAIL_USER || 'aura-ai@example.com',
      to: emailData.to || [],
      subject: emailData.subject || 'No Subject',
      text: emailData.body || '',
      html: emailData.body ? `<p>${emailData.body.replace(/\n/g, '<br>')}</p>` : '<p>No content</p>'
    };
    
    console.log('📧 Mail options:', mailOptions);
    
    // Actually send the email
    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email ACTUALLY SENT via SMTP!');
    console.log('📧 Message ID:', result.messageId);
    console.log('📧 Response:', result.response);
    
    return {
      success: true,
      messageId: result.messageId,
      to: emailData.to,
      subject: emailData.subject,
      sentAt: new Date().toISOString(),
      deliveryStatus: 'sent',
      smtpResponse: result.response
    };
  } catch (error) {
    console.error('❌ Real email send failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export { sendRealEmailNow };
