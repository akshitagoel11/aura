'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { signIn, signOut, useSession } from 'next-auth/react';
import { 
  Bot, 
  Mail, 
  CheckSquare, 
  Calendar, 
  ArrowRight, 
  CheckCircle,
  Sparkles,
  Shield,
  Zap
} from 'lucide-react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(status === 'authenticated');
  }, [status]);

  const handleConnectGoogle = async () => {
    try {
      await signIn('google');
    } catch (error) {
      console.error('Error connecting to Google:', error);
    }
  };

  const handleGoToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Productivity Platform</h1>
            </div>
            {isAuthenticated && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {session?.user?.name || session?.user?.email}</span>
                <Button onClick={handleSignOut} variant="outline" size="sm">
                  Sign Out
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-3 bg-blue-100 rounded-full">
              <Sparkles className="w-12 h-12 text-blue-600" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Your AI-Powered
            <span className="text-blue-600"> Productivity Assistant</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect your Google account and let AI help you manage emails, tasks, and calendar events through natural conversation.
          </p>
          
          {!isAuthenticated ? (
            <Button 
              onClick={handleConnectGoogle}
              size="lg"
              className="px-8 py-3 text-lg"
            >
              <Shield className="w-5 h-5 mr-2" />
              Connect Google Account
            </Button>
          ) : (
            <div className="space-y-4">
              <Badge variant="outline" className="text-green-600 border-green-600 px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                Google Account Connected
              </Badge>
              <Button 
                onClick={handleGoToDashboard}
                size="lg"
                className="px-8 py-3 text-lg"
              >
                Go to Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-600" />
                Email Management
              </CardTitle>
              <CardDescription>
                Send and organize emails with AI-powered natural language commands
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-green-600" />
                Task Automation
              </CardTitle>
              <CardDescription>
                Create and manage tasks automatically based on your conversations
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-purple-600" />
                Calendar Integration
              </CardTitle>
              <CardDescription>
                Schedule events and reminders with intelligent AI assistance
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How it Works */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Connect Google</h3>
              <p className="text-gray-600">Link your Google account securely</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Chat with AI</h3>
              <p className="text-gray-600">Use natural language commands</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Processes</h3>
              <p className="text-gray-600">AI understands and executes tasks</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">Track Progress</h3>
              <p className="text-gray-600">Monitor all activities in real-time</p>
            </div>
          </div>
        </div>

        {/* Example Commands */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">Try These Commands</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              "Send an email to my boss about the project update",
              "Create a task to finish the quarterly report",
              "Remind me tomorrow at 9am about the team meeting",
              "Schedule a reminder for next Friday at 2pm",
              "Add a task to call the client about the proposal",
              "Set up a calendar event for the product launch"
            ].map((command, index) => (
              <Card key={index} className="p-4 border-l-4 border-l-blue-500">
                <p className="text-sm text-gray-700 italic">"{command}"</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Security Notice */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
          <div className="flex justify-center mb-4">
            <Shield className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Secure & Private
          </h3>
          <p className="text-green-700">
            Your Google credentials are encrypted and stored securely. We only access your account with your permission.
          </p>
        </div>
      </main>
    </div>
  );
}
