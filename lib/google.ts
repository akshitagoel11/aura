import { google } from 'googleapis';

export async function getGoogleAuthClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return oauth2Client;
}

export async function sendEmail(accessToken: string, to: string, subject: string, body: string) {
  try {
    const auth = await getGoogleAuthClient(accessToken);
    const gmail = google.gmail({ version: 'v1', auth });

    // Create email message
    const email = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/plain; charset=utf-8',
      '',
      body
    ].join('\n');

    // Encode to base64
    const encodedMessage = Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: {
        raw: encodedMessage
      }
    });

    return { success: true, messageId: response.data.id };
  } catch (error) {
    console.error('Gmail send error:', error);
    throw new Error('Failed to send email');
  }
}
