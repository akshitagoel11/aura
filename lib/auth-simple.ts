// Simple in-memory user storage for development
// In production, this would be replaced with proper database storage

export interface User {
  id: number;
  email: string;
  fullName: string | null;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  userId: number;
  user: User;
}

// Global storage that persists across module reloads in development
declare global {
  var __authStorage__: {
    users: User[];
    sessions: { [key: string]: Session };
    nextUserId: number;
    nextSessionId: number;
  } | undefined;
}

// Initialize global storage if it doesn't exist
if (!global.__authStorage__) {
  global.__authStorage__ = {
    users: [],
    sessions: {},
    nextUserId: 1,
    nextSessionId: 1,
  };
}

// Use global storage with proper access
function getStorage() {
  if (!global.__authStorage__) {
    global.__authStorage__ = {
      users: [],
      sessions: {},
      nextUserId: 1,
      nextSessionId: 1,
    };
  }
  return global.__authStorage__;
}

// Hash password (simplified for development)
export async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt
  return btoa(password + 'salt');
}

// Verify password (simplified for development)
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return hash === btoa(password + 'salt');
}

// Create user
export async function createUser(
  email: string,
  password: string,
  fullName?: string
): Promise<User> {
  const storage = getStorage();
  console.log('[Auth] Creating user, current users count:', storage.users.length);
  
  const existingUser = storage.users.find((u: User) => u.email === email);
  if (existingUser) {
    console.log('[Auth] User already exists:', email);
    // Return null instead of throwing - let the API handle the error response
    return null as any;
  }

  const passwordHash = await hashPassword(password);
  const user: User = {
    id: storage.nextUserId++,
    email,
    fullName: fullName || null,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  storage.users.push(user);
  console.log('[Auth] User created successfully. Total users:', storage.users.length);
  console.log('[Auth] All users:', storage.users.map((u: User) => ({ id: u.id, email: u.email, hasPassword: !!u.passwordHash })));
  
  return user;
}

// Get user by email
export async function getUserByEmail(email: string): Promise<User | null> {
  const storage = getStorage();
  return storage.users.find((u: User) => u.email === email) || null;
}

// Get user by ID
export async function getUserById(userId: number): Promise<User | null> {
  const storage = getStorage();
  return storage.users.find((u: User) => u.id === userId) || null;
}

// Get user with password hash for login (simplified)
export async function getUserWithPassword(email: string): Promise<(User & { passwordHash: string }) | null> {
  const storage = getStorage();
  console.log('[Auth] Looking for user:', email);
  console.log('[Auth] Current users:', storage.users.map((u: User) => ({ id: u.id, email: u.email, hasPassword: !!u.passwordHash })));
  
  const user = storage.users.find((u: User) => u.email === email);
  if (!user) {
    console.log('[Auth] User not found in storage');
    return null;
  }
  
  console.log('[Auth] Found user:', { id: user.id, email: user.email, hasPassword: !!user.passwordHash });
  return user;
}

// Create session token
export async function createSession(userId: number): Promise<string> {
  const storage = getStorage();
  const user = storage.users.find((u: User) => u.id === userId);
  if (!user) throw new Error('User not found');
  
  const token = `session_${storage.nextSessionId++}_${Date.now()}`;
  storage.sessions[token] = { userId, user };
  
  return token;
}

// Get session
export async function getSession(token: string): Promise<Session | null> {
  const storage = getStorage();
  console.log('[Auth] Getting session for token:', token);
  console.log('[Auth] Available sessions:', Object.keys(storage.sessions));
  const session = storage.sessions[token] || null;
  console.log('[Auth] Session found:', session ? 'Yes' : 'No');
  if (session) {
    console.log('[Auth] Session user:', { userId: session.userId, userEmail: session.user.email });
  }
  return session;
}

// Delete session
export async function deleteSession(token: string): Promise<void> {
  const storage = getStorage();
  delete storage.sessions[token];
}

// Log activity (integrated with activity API)
export async function logActivity(
  userId: number,
  action: string,
  details?: Record<string, any>,
  intentExecutionId?: number
): Promise<void> {
  // Import the aiActionService to log activities
  const { aiActionService } = await import('./services-sqlite');
  
  const status = action === 'executed_intent' && details?.success ? 'executed' : 
                action === 'executed_intent' && !details?.success ? 'failed' : 'pending';
  
  await aiActionService.logAIAction(userId, {
    intentText: action,
    intentType: details?.intentType || 'activity',
    previewData: details,
    status: status as any,
    reasoning: `Activity logged: ${action}`
  });
  
  console.log(`[Activity] User ${userId}: ${action}`, details);
}
