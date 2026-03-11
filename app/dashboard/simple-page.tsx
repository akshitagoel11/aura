'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  CheckSquare, 
  Calendar, 
  MessageCircle, 
  Send, 
  Bot,
  Activity,
  Clock,
  CheckCircle
} from 'lucide-react';

interface Activity {
  id: string;
  type: string;
  description: string;
  status: string;
  createdAt: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function SimpleDashboard() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check authentication and fetch initial data
  useEffect(() => {
    checkAuth();
    fetchActivities();
    setupActivityStream();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      if (data.success) {
        setUserEmail(data.user.email);
      } else {
        // Redirect to home if not authenticated
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
      // Redirect to home if error
      window.location.href = '/';
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activity');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.activities) {
          setActivities(data.activities.slice(0, 10)); // Show last 10 activities
        }
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const setupActivityStream = () => {
    const eventSource = new EventSource('/api/activity/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update' && data.data) {
          setActivities(data.data);
        }
      } catch (error) {
        console.error('Error parsing activity stream:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Activity stream error:', error);
    };

    return () => {
      eventSource.close();
    };
  };

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    const userMessage = {
      role: 'user' as const,
      content: message,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant' as const,
          content: formatAssistantResponse(data),
          timestamp: new Date().toISOString()
        };

        setChatMessages(prev => [...prev, assistantMessage]);
        setMessage('');
        
        // Refresh activities after a short delay
        setTimeout(fetchActivities, 1000);
      } else {
        throw new Error(data.error || 'Failed to process message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        role: 'assistant' as const,
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatAssistantResponse = (data: any) => {
    if (data.result?.data?.response) {
      return data.result.data.response;
    }
    
    if (data.result?.success) {
      const intentType = data.intent || 'action';
      switch (intentType) {
        case 'send_email':
          return `✅ Email sent successfully to ${data.result.data?.to || 'recipient'}`;
        case 'create_task':
          return `✅ Task "${data.result.data?.title || 'created'}" has been created`;
        case 'create_reminder':
          return `✅ Reminder "${data.result.data?.title || 'created'}" has been scheduled`;
        default:
          return `✅ Action completed successfully`;
      }
    }
    
    return 'I processed your request. Check the activity feed for details.';
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'email_sent': return <Mail className="w-4 h-4" />;
      case 'task_created': return <CheckSquare className="w-4 h-4" />;
      case 'reminder_created': return <Calendar className="w-4 h-4" />;
      case 'chat_interaction': return <MessageCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'email_sent': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'task_created': return 'bg-green-100 text-green-800 border-green-200';
      case 'reminder_created': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'chat_interaction': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!userEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardHeader className="text-center">
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please connect your Google account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => window.location.href = '/api/auth/google'}
              className="w-full"
            >
              Connect Google Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Bot className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Productivity Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {userEmail}</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Chat Section - 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Chat Interface */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="w-5 h-5" />
                  AI Assistant
                </CardTitle>
                <CardDescription>
                  Tell me what you want to do - send emails, create tasks, set reminders, or just chat
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Chat Messages */}
                <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg">
                  {chatMessages.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Bot className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Start a conversation with your AI assistant!</p>
                      <p className="text-sm mt-2">Try: "Send an email to my boss about the project update"</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.role === 'user'
                              ? 'bg-blue-600 text-white'
                              : 'bg-white border text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{msg.content}</p>
                          <p className={`text-xs mt-1 ${
                            msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            {formatTime(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Area */}
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Type your message here..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="flex-1 min-h-20"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={loading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={loading || !message.trim()}
                    className="px-6"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Activity Feed - 1 column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Real-time updates of your actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activities.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No activities yet</p>
                      <p className="text-xs mt-1">Start by sending a message to the AI!</p>
                    </div>
                  ) : (
                    activities.map((activity) => (
                      <div
                        key={activity.id}
                        className={`p-3 rounded-lg border ${getActivityColor(activity.type)}`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {activity.description}
                            </p>
                            <p className="text-xs opacity-75 mt-1">
                              {formatTime(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Activities</span>
                    <span className="font-medium">{activities.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Messages Sent</span>
                    <span className="font-medium">
                      {chatMessages.filter(m => m.role === 'user').length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
