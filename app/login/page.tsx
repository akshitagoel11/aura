'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoginSuccessModal from '@/components/login-success-modal';
import { AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const router = useRouter();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('[v0] Attempting login with:', email);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.log('[v0] Login failed:', data.error);
        setError(data.error || 'Login failed');
        setErrorCode(data.code || '');
        throw new Error(data.error || 'Login failed');
      }

      console.log('[v0] Login successful, redirecting to dashboard');
      
      // Show success modal before redirecting
      setShowSuccessModal(true);
      
      // Auto-redirect after modal display
      setTimeout(() => {
        router.push('/dashboard');
      }, 3000);
      
    } catch (err) {
      console.error('[v0] Login error:', err);
      // Don't set error here since it's already set above
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 to-slate-800 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Welcome to Aura</CardTitle>
            <CardDescription>Sign in to your account to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-input text-foreground"
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
                  className="bg-input text-foreground"
                />
              </div>
              {error && (
                <div className="text-sm p-3 rounded-md flex items-start gap-2 {
                  errorCode === 'USER_NOT_FOUND' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 
                  errorCode === 'INVALID_PASSWORD' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                  'bg-red-50 text-red-700 border border-red-200'
                }">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{error}</p>
                    {errorCode === 'USER_NOT_FOUND' && (
                      <div className="mt-2 space-y-1">
                        <Link href="/register" className="text-blue-600 hover:underline font-medium">
                          Create an account
                        </Link>
                        <span className="text-gray-600"> to get started.</span>
                      </div>
                    )}
                    {errorCode === 'INVALID_PASSWORD' && (
                      <div className="mt-2 space-y-1">
                        <button className="text-orange-600 hover:underline font-medium">
                          Reset your password
                        </button>
                        <span className="text-gray-600"> or try again.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90" 
                disabled={loading}
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
              <div>
                Don't have an account?{' '}
                <Link href="/register" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
              <div>
                <button className="text-primary hover:underline">
                  Forgot your password?
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <LoginSuccessModal 
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          router.push('/dashboard');
        }}
      />
    </>
  );
}
