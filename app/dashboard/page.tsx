'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Mail, 
  CheckSquare, 
  Calendar, 
  MessageCircle, 
  Send, 
  Bot,
  Activity,
  Clock,
  CheckCircle,
  LogOut,
  Menu,
  X,
  BarChart3,
  Settings
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

interface DraftEmail {
  to: string;
  subject: string;
  body: string;
}

interface DraftTask {
  title: string;
  notes: string;
  due: string;
}

interface DraftReminder {
  title: string;
  description: string;
  time: string;
}

interface DraftItem {
  type: 'email' | 'task' | 'reminder';
  data: DraftEmail | DraftTask | DraftReminder;
  id: string;
  createdAt: string;
}

interface Analytics {
  aiQueries: number;
  emailsSent: number;
  tasksAdded: number;
  remindersScheduled: number;
  totalActivities: number;
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const [activeModule, setActiveModule] = useState('chat');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [drafts, setDrafts] = useState<DraftItem[]>([]);
  const [showDraftModal, setShowDraftModal] = useState(false);
  const [currentDraft, setCurrentDraft] = useState<DraftItem | null>(null);
  const [analytics, setAnalytics] = useState<Analytics>({
    aiQueries: 0,
    emailsSent: 0,
    tasksAdded: 0,
    remindersScheduled: 0,
    totalActivities: 0
  });

  // Email form state
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: ''
  });

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    notes: '',
    due: ''
  });

  // Reminder form state
  const [reminderForm, setReminderForm] = useState({
    title: '',
    description: '',
    time: ''
  });

  // Loading states
  const [isCreatingReminder, setIsCreatingReminder] = useState(false);

  // Check authentication and fetch initial data
  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = '/';
    } else if (status === 'authenticated') {
      fetchActivities();
      fetchAnalytics();
      setupActivityStream();
    }
  }, [status]);

  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/activity');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.activities) {
          setActivities(data.activities.slice(0, 10));
        }
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/analytics');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAnalytics(data.analytics);
        }
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const setupActivityStream = () => {
    const eventSource = new EventSource('/api/activity/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update' && data.data) {
          setActivities(data.data.slice(0, 10));
          fetchAnalytics(); // Refresh analytics
        }
      } catch (error) {
        console.error('Error parsing activity stream:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Activity stream error:', error);
      eventSource.close();
    };
  };

  const handleSendMessage = async () => {
    if (!message.trim() || loading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const data = await response.json();
      
      if (data.success) {
        const aiResponse = data.response;
        let assistantMessage: ChatMessage;

        if (aiResponse.intent) {
          // Handle structured AI response - create draft instead of executing
          const draft = createDraftFromIntent(aiResponse, message);
          if (draft) {
            setCurrentDraft(draft);
            setShowDraftModal(true);
            assistantMessage = {
              role: 'assistant',
              content: `I've prepared a ${aiResponse.intent.replace('_', ' ')} draft for you. Please review it before sending.`,
              timestamp: new Date().toISOString()
            };
          } else {
            assistantMessage = {
              role: 'assistant',
              content: 'I understand your request, but I need more information to create the draft.',
              timestamp: new Date().toISOString()
            };
          }
        } else {
          assistantMessage = {
            role: 'assistant',
            content: aiResponse.response || 'I understand. How can I help you further?',
            timestamp: new Date().toISOString()
          };
        }

        setChatMessages(prev => [...prev, assistantMessage]);
        
        // Log analytics
        await logAction('chat_interaction');
      } else {
        const errorMessage: ChatMessage = {
          role: 'assistant',
          content: 'Sorry, I encountered an error processing your request.',
          timestamp: new Date().toISOString()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date().toISOString()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const createDraftFromIntent = (intent: any, originalMessage: string): DraftItem | null => {
    const userName = session?.user?.name || session?.user?.email || 'User';
    
    switch (intent.intent) {
      case 'send_email':
        const emailDraft: DraftEmail = {
          to: intent.to || 'recipient@example.com',
          subject: intent.subject || 'No Subject',
          body: `${intent.body || ''}\n\n\nBest regards,\n${userName}`
        };
        
        return {
          type: 'email',
          data: emailDraft,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
      case 'create_task':
        const taskDraft: DraftTask = {
          title: intent.title || 'New Task',
          notes: intent.notes || '',
          due: intent.due || ''
        };
        
        return {
          type: 'task',
          data: taskDraft,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
      case 'create_reminder':
        const reminderDraft: DraftReminder = {
          title: intent.title || 'New Reminder',
          description: intent.description || '',
          time: intent.time || new Date(Date.now() + 3600000).toISOString().slice(0, 16) // 1 hour from now
        };
        
        return {
          type: 'reminder',
          data: reminderDraft,
          id: Date.now().toString(),
          createdAt: new Date().toISOString()
        };
        
      default:
        return null;
    }
  };

  const handleApproveDraft = async () => {
    if (!currentDraft) return;
    
    const { type, data } = currentDraft;
    
    try {
      switch (type) {
        case 'email':
          await sendEmail((data as DraftEmail).to, (data as DraftEmail).subject, (data as DraftEmail).body);
          break;
        case 'task':
          await createTask((data as DraftTask).title, (data as DraftTask).notes, (data as DraftTask).due);
          break;
        case 'reminder':
          await createReminder((data as DraftReminder).title, (data as DraftReminder).description, (data as DraftReminder).time);
          break;
      }
      
      // Add to drafts history
      setDrafts(prev => [currentDraft, ...prev]);
      setShowDraftModal(false);
      setCurrentDraft(null);
      
      // Log activity
      await logAction(`${type}_created`);
      
    } catch (error) {
      console.error('Error executing draft:', error);
    }
  };

  const handleRejectDraft = () => {
    setShowDraftModal(false);
    setCurrentDraft(null);
  };

  const executeAIIntent = async (intent: any) => {
    try {
      switch (intent.intent) {
        case 'send_email':
          await sendEmail(intent.to, intent.subject, intent.body);
          break;
        case 'create_task':
          await createTask(intent.title, intent.notes, intent.due);
          break;
        case 'create_reminder':
          await createReminder(intent.title, intent.description, intent.time);
          break;
      }
    } catch (error) {
      console.error('Error executing AI intent:', error);
    }
  };

  const sendEmail = async (to: string, subject: string, body: string) => {
    const response = await fetch('/api/gmail/send', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, subject, body })
    });

    if (response.ok) {
      await logAction('email_sent');
      fetchActivities();
    }
  };

  const createTask = async (title: string, notes?: string, due?: string) => {
    const response = await fetch('/api/tasks/create', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, notes, due })
    });

    if (response.ok) {
      await logAction('task_created');
      fetchActivities();
    }
  };

  const createReminder = async (title: string, description: string, time: string) => {
    const response = await fetch('/api/calendar/reminder', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, time })
    });

    if (response.ok) {
      await logAction('reminder_created');
      fetchActivities();
    }
  };

  const logAction = async (action: string) => {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
    } catch (error) {
      console.error('Error logging action:', error);
    }
  };

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) return;
    
    await sendEmail(emailForm.to, emailForm.subject, emailForm.body);
    setEmailForm({ to: '', subject: '', body: '' });
  };

  const handleCreateTask = async () => {
    if (!taskForm.title) return;
    
    await createTask(taskForm.title, taskForm.notes, taskForm.due);
    setTaskForm({ title: '', notes: '', due: '' });
  };

  const handleCreateReminder = async () => {
    if (!reminderForm.title || !reminderForm.time) {
      alert('Please fill in the title and date/time for the reminder.');
      return;
    }
    
    setIsCreatingReminder(true);
    try {
      console.log('Creating reminder:', reminderForm);
      await createReminder(reminderForm.title, reminderForm.description, reminderForm.time);
      setReminderForm({ title: '', description: '', time: '' });
      console.log('Reminder created successfully');
    } catch (error) {
      console.error('Error creating reminder:', error);
      alert('Failed to create reminder. Please try again.');
    } finally {
      setIsCreatingReminder(false);
    }
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

  const handleSignOut = async () => {
    await signOut();
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect
  }

  const renderMainContent = () => {
    switch (activeModule) {
      case 'chat':
        return (
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
        );

      case 'email':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Mail className="w-5 h-5" />
                Send Email
              </CardTitle>
              <CardDescription>
                Send emails using your Gmail account
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    type="email"
                    placeholder="recipient@example.com"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, to: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Email subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="body">Message</Label>
                  <Textarea
                    id="body"
                    placeholder="Type your message here..."
                    value={emailForm.body}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, body: e.target.value }))}
                    className="min-h-32"
                  />
                </div>
                <Button onClick={handleSendEmail} className="w-full">
                  <Send className="w-4 h-4 mr-2" />
                  Send Email
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'tasks':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CheckSquare className="w-5 h-5" />
                Create Task
              </CardTitle>
              <CardDescription>
                Add tasks to your Google Tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="taskTitle">Task Title</Label>
                  <Input
                    id="taskTitle"
                    placeholder="What needs to be done?"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="taskNotes">Notes</Label>
                  <Textarea
                    id="taskNotes"
                    placeholder="Additional details..."
                    value={taskForm.notes}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="taskDue">Due Date (optional)</Label>
                  <Input
                    id="taskDue"
                    type="datetime-local"
                    value={taskForm.due}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, due: e.target.value }))}
                  />
                </div>
                <Button onClick={handleCreateTask} className="w-full">
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'reminders':
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                Create Reminder
              </CardTitle>
              <CardDescription>
                Schedule reminders in Google Calendar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reminderTitle">Reminder Title</Label>
                  <Input
                    id="reminderTitle"
                    placeholder="What do you need to remember?"
                    value={reminderForm.title}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reminderDescription">Description</Label>
                  <Textarea
                    id="reminderDescription"
                    placeholder="Reminder details..."
                    value={reminderForm.description}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reminderTime">Date & Time</Label>
                  <Input
                    id="reminderTime"
                    type="datetime-local"
                    value={reminderForm.time}
                    onChange={(e) => setReminderForm(prev => ({ ...prev, time: e.target.value }))}
                  />
                </div>
                <Button onClick={handleCreateReminder} className="w-full" disabled={isCreatingReminder}>
                  <Calendar className="w-4 h-4 mr-2" />
                  {isCreatingReminder ? 'Creating...' : 'Create Reminder'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5" />
                  Analytics Dashboard
                </CardTitle>
                <CardDescription>
                  Your productivity metrics for today
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold text-blue-600">{analytics.aiQueries}</div>
                    <div className="text-sm text-gray-600">AI Queries</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Mail className="w-8 h-8 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold text-green-600">{analytics.emailsSent}</div>
                    <div className="text-sm text-gray-600">Emails Sent</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <CheckSquare className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-600">{analytics.tasksAdded}</div>
                    <div className="text-sm text-gray-600">Tasks Added</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Calendar className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold text-orange-600">{analytics.remindersScheduled}</div>
                    <div className="text-sm text-gray-600">Reminders Set</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden"
              >
                {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
              <Bot className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">AI Productivity Assistant</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {session.user?.name || session.user?.email}</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                <CheckCircle className="w-3 h-3 mr-1" />
                Connected
              </Badge>
              <Button onClick={handleSignOut} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Draft Modal */}
      {showDraftModal && currentDraft && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {currentDraft.type === 'email' && <Mail className="w-5 h-5" />}
                {currentDraft.type === 'task' && <CheckSquare className="w-5 h-5" />}
                {currentDraft.type === 'reminder' && <Calendar className="w-5 h-5" />}
                Review {currentDraft.type} Draft
              </CardTitle>
              <CardDescription>
                Please review the generated {currentDraft.type} before sending
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentDraft.type === 'email' && (
                <div className="space-y-4">
                  <div>
                    <Label>To:</Label>
                    <p className="font-medium">{(currentDraft.data as DraftEmail).to}</p>
                  </div>
                  <div>
                    <Label>Subject:</Label>
                    <p className="font-medium">{(currentDraft.data as DraftEmail).subject}</p>
                  </div>
                  <div>
                    <Label>Message:</Label>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{(currentDraft.data as DraftEmail).body}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {currentDraft.type === 'task' && (
                <div className="space-y-4">
                  <div>
                    <Label>Task Title:</Label>
                    <p className="font-medium">{(currentDraft.data as DraftTask).title}</p>
                  </div>
                  <div>
                    <Label>Notes:</Label>
                    <p className="text-gray-600">{(currentDraft.data as DraftTask).notes || 'No notes'}</p>
                  </div>
                  <div>
                    <Label>Due Date:</Label>
                    <p className="text-gray-600">{(currentDraft.data as DraftTask).due || 'No due date'}</p>
                  </div>
                </div>
              )}
              
              {currentDraft.type === 'reminder' && (
                <div className="space-y-4">
                  <div>
                    <Label>Reminder Title:</Label>
                    <p className="font-medium">{(currentDraft.data as DraftReminder).title}</p>
                  </div>
                  <div>
                    <Label>Description:</Label>
                    <p className="text-gray-600">{(currentDraft.data as DraftReminder).description || 'No description'}</p>
                  </div>
                  <div>
                    <Label>Date & Time:</Label>
                    <p className="text-gray-600">{(currentDraft.data as DraftReminder).time}</p>
                  </div>
                </div>
              )}
              
              <div className="flex space-x-3 pt-4">
                <Button onClick={handleApproveDraft} className="flex-1">
                  <Send className="w-4 h-4 mr-2" />
                  Send {currentDraft.type}
                </Button>
                <Button onClick={handleRejectDraft} variant="outline" className="flex-1">
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className={`${sidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-64 space-y-6`}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Navigation</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant={activeModule === 'chat' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setActiveModule('chat')}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  AI Chat
                </Button>
                <Button 
                  variant={activeModule === 'email' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setActiveModule('email')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
                <Button 
                  variant={activeModule === 'tasks' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setActiveModule('tasks')}
                >
                  <CheckSquare className="w-4 h-4 mr-2" />
                  Tasks
                </Button>
                <Button 
                  variant={activeModule === 'reminders' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setActiveModule('reminders')}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Reminders
                </Button>
                <Button 
                  variant={activeModule === 'analytics' ? 'default' : 'ghost'} 
                  className="w-full justify-start"
                  onClick={() => setActiveModule('analytics')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Analytics
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start"
                  onClick={() => setActiveModule('settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
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
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
            {/* Welcome Message */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">
                  Welcome back, {session.user?.name || 'User'}! 👋
                </CardTitle>
                <CardDescription>
                  How can I help you be more productive today?
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Dynamic Content */}
            {renderMainContent()}

            {/* Activity Feed */}
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
          </main>
        </div>
      </div>
    </div>
  );
}
