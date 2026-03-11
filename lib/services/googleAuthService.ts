import { google } from "googleapis";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface GoogleUser {
  id: string;
  email: string;
  googleRefreshToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class GoogleAuthService {
  private oauth2Client: any;

  constructor() {
    // Check if environment variables are set
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

    if (!clientId || !clientSecret) {
      console.warn('[Google Auth] Missing environment variables. OAuth will not work properly.');
      console.warn('Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
    }

    // Only initialize OAuth if credentials are available
    if (clientId && clientSecret) {
      this.oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
      );
    } else {
      // Create a mock client for development
      this.oauth2Client = null;
    }
  }

  getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth is not configured. Please set environment variables.');
    }
    
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/tasks',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      prompt: 'consent'
    });
  }

  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth is not configured. Please set environment variables.');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to obtain tokens from Google');
    }

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token
    };
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await this.oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error('Failed to refresh access token');
    }

    return credentials.access_token;
  }

  async getUserInfo(accessToken: string): Promise<{
    email: string;
    name?: string;
  }> {
    if (!this.oauth2Client) {
      throw new Error('Google OAuth is not configured. Please set environment variables.');
    }

    this.oauth2Client.setCredentials({ access_token: accessToken });

    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
    const { data } = await oauth2.userinfo.get();

    return {
      email: data.email || '',
      name: data.name || undefined
    };
  }

  async saveUserTokens(email: string, refreshToken: string) {
    try {
      await prisma.user.upsert({
        where: { email },
        update: { googleRefreshToken: refreshToken },
        create: {
          email,
          googleRefreshToken: refreshToken
        }
      });
    } catch (error) {
      console.error('Error saving user tokens:', error);
      throw new Error('Failed to save user tokens');
    }
  }

  async getAuthenticatedUser(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user || !user.googleRefreshToken) {
        throw new Error('User not found or no refresh token available');
      }

      if (!this.oauth2Client) {
        throw new Error('Google OAuth is not configured. Please set environment variables.');
      }

      this.oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken
      });

      return this.oauth2Client;
    } catch (error) {
      console.error('Error getting authenticated user:', error);
      throw new Error('Failed to get authenticated user');
    }
  }
}

export const googleAuthService = new GoogleAuthService();
