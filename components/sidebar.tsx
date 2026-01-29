'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Inbox, 
  CheckSquare, 
  Bell, 
  Activity, 
  Settings, 
  Brain,
  Pause,
  Play,
  HelpCircle,
  BarChart3,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isAIPaused?: boolean;
  onToggleAI?: () => void;
  cognitiveLoad?: 'low' | 'medium' | 'high';
}

export default function Sidebar({ isAIPaused = false, onToggleAI, cognitiveLoad = 'low' }: SidebarProps) {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigation = [
    {
      name: 'Inbox',
      href: '/dashboard',
      icon: Inbox,
      current: pathname === '/dashboard',
      badge: null,
    },
    {
      name: 'Tasks',
      href: '/dashboard/tasks',
      icon: CheckSquare,
      current: pathname === '/dashboard/tasks',
      badge: '12',
    },
    {
      name: 'Reminders',
      href: '/dashboard/reminders',
      icon: Bell,
      current: pathname === '/dashboard/reminders',
      badge: '3',
    },
    {
      name: 'Activity',
      href: '/dashboard/activity',
      icon: Activity,
      current: pathname === '/dashboard/activity',
      badge: null,
    },
    {
      name: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      current: pathname === '/dashboard/settings',
      badge: null,
    },
  ];

  const getCognitiveLoadColor = () => {
    switch (cognitiveLoad) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-green-500';
    }
  };

  const getCognitiveLoadText = () => {
    switch (cognitiveLoad) {
      case 'high':
        return 'High Load';
      case 'medium':
        return 'Medium Load';
      default:
        return 'Low Load';
    }
  };

  return (
    <div className={`flex flex-col bg-card border-r border-border transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Brain className="w-4 h-4 text-primary-foreground" />
          </div>
          {!isCollapsed && (
            <div>
              <h1 className="font-bold text-foreground">Aura</h1>
              <p className="text-xs text-muted-foreground">AI Productivity</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                item.current
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {!isCollapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="text-xs">
                      {item.badge}
                    </Badge>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>

      {/* AI Controls & Status */}
      <div className="p-4 border-t border-border space-y-4">
        {/* Cognitive Load Indicator */}
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Cognitive Load</span>
              <span className="font-medium text-foreground">{getCognitiveLoadText()}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${getCognitiveLoadColor()}`} />
              <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 ${getCognitiveLoadColor()}`}
                  style={{ width: cognitiveLoad === 'high' ? '90%' : cognitiveLoad === 'medium' ? '60%' : '30%' }}
                />
              </div>
            </div>
          </div>
        )}

        {/* AI Execution Toggle */}
        <Button
          variant={isAIPaused ? "outline" : "default"}
          size={isCollapsed ? "icon" : "sm"}
          onClick={onToggleAI}
          className="w-full"
        >
          {isAIPaused ? (
            <>
              <Play className="w-4 h-4" />
              {!isCollapsed && <span className="ml-2">Resume AI</span>}
            </>
          ) : (
            <>
              <Pause className="w-4 h-4" />
              {!isCollapsed && <span className="ml-2">Pause AI</span>}
            </>
          )}
        </Button>

        {/* Help */}
        {!isCollapsed && (
          <Link
            href="/dashboard/help"
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Help & Support</span>
          </Link>
        )}
      </div>
    </div>
  );
}
