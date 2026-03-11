import { AuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
  }
}

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
          scope: "https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
        }
      }
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, user }) {
      console.log('[NextAuth JWT] Callback triggered');
      console.log('[NextAuth JWT] Account:', account?.provider);
      console.log('[NextAuth JWT] Has access_token:', !!account?.access_token);
      console.log('[NextAuth JWT] User:', user?.email);
      
      // Initial sign in
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.idToken = account.id_token;
        console.log('[NextAuth JWT] Tokens stored in JWT');
        console.log('[NextAuth JWT] Access token length:', token.accessToken?.length);
      }
      
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth Session] Callback triggered');
      console.log('[NextAuth Session] Token has access:', !!token.accessToken);
      
      if (token) {
        session.accessToken = token.accessToken;
        session.refreshToken = token.refreshToken;
        session.idToken = token.idToken;
        console.log('[NextAuth Session] Access token in session:', !!session.accessToken);
        console.log('[NextAuth Session] Access token length:', session.accessToken?.length);
      }
      
      return session;
    },
    async redirect({ url, baseUrl }) {
      return baseUrl + '/dashboard';
    }
  },
  pages: {
    signIn: '/'
  }
};
