'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle } from 'lucide-react';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    console.log('[v0] Registration attempt with email:', email);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      console.log('[v0] Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      console.log('[v0] Password too short');
      return;
    }

    setLoading(true);

    try {
      console.log('[Client] Fetching /api/auth/register');
      const apiUrl = '/api/auth/register';
      console.log('[Client] Full API URL:', window.location.origin + apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password }),
      });

      console.log('[Client] Registration response status:', response.status);
      console.log('[Client] Response headers:', response.headers.get('content-type'));
      
      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('[Client] Non-JSON response:', text);
        setError('Server returned non-JSON response');
        return;
      }
      
      const data = await response.json();
      console.log('[Client] Registration response:', data);

      if (!response.ok) {
        setError(data.error || 'Registration failed');
        setErrorCode(data.code || '');
        console.log('[Client] Registration failed:', data.error);
        
        // If user already exists, show a helpful message and redirect option
        if (data.code === 'USER_EXISTS') {
          setTimeout(() => {
            router.push('/login');
          }, 3000);
        }
        return;
      }

      console.log('[Client] Registration successful, redirecting to login');
      router.push('/login');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('[Client] Registration error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl">Welcome to Aura</CardTitle>
          <CardDescription>Join Aura to automate your tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Full Name</label>
              <Input
                type="text"
                placeholder="John Doe"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Email</label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Confirm Password</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {error && (
              <div className={`text-sm p-3 rounded-md flex items-start gap-2 ${
                errorCode === 'USER_EXISTS' ? 'bg-orange-50 text-orange-700 border border-orange-200' : 
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {errorCode === 'USER_EXISTS' ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                )}
                <div className="flex-1">
                  <p className="font-medium">{error}</p>
                  {errorCode === 'USER_EXISTS' && (
                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-orange-600">
                        Redirecting you to login page in 3 seconds...
                      </p>
                      <Link href="/login" className="text-orange-700 hover:underline font-medium">
                        Go to login now
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Sign in here
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
