'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Sidebar from '@/components/sidebar';
import DashboardHeader from '@/components/dashboard-header';
import { User, Bell, Shield, Brain, Palette } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // Profile Settings
    fullName: 'John Doe',
    email: 'john@example.com',
    
    // Notification Settings
    emailNotifications: true,
    pushNotifications: true,
    reminderNotifications: true,
    
    // AI Settings
    aiEnabled: true,
    autoExecute: false,
    confidenceThreshold: 0.8,
    
    // Privacy Settings
    dataRetention: '30',
    shareAnalytics: false,
    
    // Appearance
    theme: 'dark',
    language: 'en',
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        
        <main className="flex-1 container mx-auto max-w-4xl px-4 py-8">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-foreground">Settings</h1>
              <p className="text-muted-foreground">Manage your account and application preferences</p>
            </div>

            {/* Profile Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Settings
                </CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={settings.fullName}
                    onChange={(e) => updateSetting('fullName', e.target.value)}
                    className="bg-input text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={settings.email}
                    onChange={(e) => updateSetting('email', e.target.value)}
                    className="bg-input text-foreground"
                  />
                </div>
                <Button className="bg-primary hover:bg-primary/90">Save Profile</Button>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
                <CardDescription>Control how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Email Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive notifications via email</div>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Push Notifications</div>
                    <div className="text-sm text-muted-foreground">Receive browser push notifications</div>
                  </div>
                  <Switch
                    checked={settings.pushNotifications}
                    onCheckedChange={(checked) => updateSetting('pushNotifications', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Reminder Notifications</div>
                    <div className="text-sm text-muted-foreground">Get notified about upcoming reminders</div>
                  </div>
                  <Switch
                    checked={settings.reminderNotifications}
                    onCheckedChange={(checked) => updateSetting('reminderNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* AI Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="w-5 h-5" />
                  AI Settings
                </CardTitle>
                <CardDescription>Configure AI behavior and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Enable AI Assistant</div>
                    <div className="text-sm text-muted-foreground">Allow AI to help with tasks</div>
                  </div>
                  <Switch
                    checked={settings.aiEnabled}
                    onCheckedChange={(checked) => updateSetting('aiEnabled', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Auto-execute Actions</div>
                    <div className="text-sm text-muted-foreground">Automatically execute high-confidence AI suggestions</div>
                  </div>
                  <Switch
                    checked={settings.autoExecute}
                    onCheckedChange={(checked) => updateSetting('autoExecute', checked)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confidence">Confidence Threshold: {Math.round(settings.confidenceThreshold * 100)}%</Label>
                  <input
                    type="range"
                    id="confidence"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.confidenceThreshold}
                    onChange={(e) => updateSetting('confidenceThreshold', parseFloat(e.target.value))}
                    className="w-full"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>Manage your data and privacy preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="retention">Data Retention Period</Label>
                  <Select value={settings.dataRetention} onValueChange={(value) => updateSetting('dataRetention', value)}>
                    <SelectTrigger className="bg-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">7 days</SelectItem>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-foreground">Share Analytics</div>
                    <div className="text-sm text-muted-foreground">Help improve the product by sharing usage data</div>
                  </div>
                  <Switch
                    checked={settings.shareAnalytics}
                    onCheckedChange={(checked) => updateSetting('shareAnalytics', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize the look and feel</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                    <SelectTrigger className="bg-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                    <SelectTrigger className="bg-input text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline">Cancel</Button>
              <Button className="bg-primary hover:bg-primary/90">Save All Settings</Button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
