import { google } from 'googleapis';

export interface GoogleSession {
  accessToken?: string;
  refreshToken?: string;
  idToken?: string;
}

export function createGoogleClient(session: GoogleSession) {
  console.log('[Google Client] Creating client with access token:', !!session.accessToken);
  
  if (!session.accessToken) {
    throw new Error('No access token found in session');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: session.accessToken,
    refresh_token: session.refreshToken
  });

  console.log('[Google Client] OAuth2 client created successfully');
  return oauth2Client;
}

export function createGmailClient(session: GoogleSession) {
  const auth = createGoogleClient(session);
  const gmail = google.gmail({ version: 'v1', auth });
  console.log('[Google Client] Gmail client created');
  return gmail;
}

export function createTasksClient(session: GoogleSession) {
  const auth = createGoogleClient(session);
  const tasks = google.tasks({ version: 'v1', auth });
  console.log('[Google Client] Tasks client created');
  return tasks;
}

export function createCalendarClient(session: GoogleSession) {
  const auth = createGoogleClient(session);
  const calendar = google.calendar({ version: 'v3', auth });
  console.log('[Google Client] Calendar client created');
  return calendar;
}
