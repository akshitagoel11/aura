'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Sidebar from '@/components/sidebar';
import DashboardHeader from '@/components/dashboard-header';
import IntentPreview from '@/components/intent-preview';
import { EnhancedActivityTimeline } from '@/components/enhanced-activity-timeline';
import WeeklyReflection from '@/components/weekly-reflection';
import { 
  ChevronDown, 
  ChevronUp, 
  Info, 
  Brain, 
  AlertTriangle, 
  CheckCircle,
  Lightbulb,
  Zap,
  Pause,
  Play,
  TrendingUp
} from 'lucide-react';

type IntentType = 'email' | 'task' | 'reminder' | 'chat';

interface ExplainabilityData {
  confidence: number;
  reasoning: string;
  alternatives: string[];
  risks: string[];
  estimatedTime: string;
}

interface CognitiveLoadData {
  level: 'low' | 'medium' | 'high' | 'overloaded';
  taskCount: number;
  warning?: string;
}

export default function EnhancedDashboardPage() {
  const [intent, setIntent] = useState('');
  const [intentType, setIntentType] = useState<IntentType>('email');
  const [preview, setPreview] = useState<any>(null);
  const [explainability, setExplainability] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'input' | 'preview' | 'executed'>('input');
  const [isAIPaused, setIsAIPaused] = useState(false);
  const [cognitiveLoad, setCognitiveLoad] = useState<'low' | 'medium' | 'high' | 'overloaded'>('low');
  const [showExplainability, setShowExplainability] = useState(false);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch cognitive load on component mount and after actions
  useEffect(() => {
    fetchCognitiveLoad();
  }, [refreshKey]);

  async function fetchCognitiveLoad() {
    try {
      const response = await fetch('/api/cognitive-load');
      if (response.ok) {
        const data = await response.json();
        setCognitiveLoad({
          level: data.loadLevel,
          taskCount: data.taskCount,
          warning: data.loadLevel === 'overloaded' ? 'Today looks overloaded - consider rescheduling some tasks' : 
                   data.loadLevel === 'high' ? 'High cognitive load detected' : undefined
        });
      }
    } catch (error) {
      console.error('Failed to fetch cognitive load:', error);
    }
  }

  async function generatePreview() {
    if (!intent.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, intentType }),
      });

      if (!response.ok) throw new Error('Failed to generate preview');

      const data = await response.json();
      setPreview(data.preview);
      setCurrentDraftId(data.draftId || null);
      
      // Set explainability data from API response
      setExplainability({
        confidence: data.confidence || 0.85,
        reasoning: data.reasoning || `AI identified this as a ${intentType} request based on keywords and context patterns.`,
        alternatives: data.alternatives || [
          `Create a ${intentType} draft instead`,
          `Schedule this for later review`,
          `Break down into smaller tasks`
        ],
        risks: data.risks || [],
        estimatedTime: data.estimatedTime || '< 1 minute'
      });
      
      setStep('preview');
    } catch (error) {
      console.error('Preview error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function regeneratePreview() {
    if (!intent.trim() || !currentDraftId) return;

    setRegenerating(true);
    try {
      const response = await fetch('/api/ai/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          intent, 
          intentType, 
          regenerate: true, 
          previousDraft: JSON.stringify(preview) 
        }),
      });

      if (!response.ok) throw new Error('Failed to regenerate preview');

      const data = await response.json();
      setPreview(data.preview);
      setCurrentDraftId(data.draftId || null);
      
      // Update explainability data
      setExplainability({
        confidence: data.confidence || 0.85,
        reasoning: data.reasoning || `AI regenerated this ${intentType} with different approach`,
        alternatives: data.alternatives || [
          'Try another regeneration',
          'Modify specific parts',
          'Start over with new input'
        ],
        risks: data.risks || [],
        estimatedTime: data.estimatedTime || '< 1 minute'
      });
    } catch (error) {
      console.error('Regeneration error:', error);
    } finally {
      setRegenerating(false);
    }
  }

  async function executeIntent() {
    setLoading(true);
    setStep('confirming');

    try {
      console.log('[Frontend] Executing intent with data:', { intent, intentType, preview });
      
      const response = await fetch('/api/ai/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent, intentType, preview }),
      });

      console.log('[Frontend] Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Frontend] Error response:', errorText);
        throw new Error(`Failed to execute intent: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('[Frontend] Execution success:', data);

      // Update cognitive load after execution
      await fetchCognitiveLoad();
      setRefreshKey(prev => prev + 1);

      setIntent('');
      setPreview(null);
      setExplainability(null);
      setStep('input');
    } catch (error) {
      console.error('Execution error:', error);
      setStep('preview');
    } finally {
      setLoading(false);
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-500';
    if (confidence >= 0.6) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return CheckCircle;
    if (confidence >= 0.6) return AlertTriangle;
    return AlertTriangle;
  };

  const getCognitiveLoadColor = (level: string) => {
    switch (level) {
      case 'overloaded': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar 
        isAIPaused={isAIPaused}
        onToggleAI={() => setIsAIPaused(!isAIPaused)}
        cognitiveLoad={cognitiveLoad.level}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <DashboardHeader />

        <main className="flex-1 container mx-auto max-w-6xl px-4 py-8">
          <div className="grid gap-8">
            {/* Cognitive Load Indicator */}
            {cognitiveLoad.warning && (
              <Card className="border-orange-500/20 bg-orange-500/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getCognitiveLoadColor(cognitiveLoad.level)}`} />
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-400">
                        Cognitive Load: {cognitiveLoad.level.toUpperCase()}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({cognitiveLoad.taskCount} tasks today)
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-orange-300 mt-2">{cognitiveLoad.warning}</p>
                </CardContent>
              </Card>
            )}

            {/* AI Task Input Section */}
            <Card className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Brain className="w-6 h-6 text-primary" />
                      AI Task Assistant
                    </CardTitle>
                    <CardDescription>
                      Describe what you want to do, and we'll preview it before execution
                    </CardDescription>
                  </div>
                  {isAIPaused && (
                    <Badge variant="outline" className="text-orange-500 border-orange-500">
                      <Pause className="w-3 h-3 mr-1" />
                      AI Paused
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Intent Type Selector */}
                <Tabs value={intentType} onValueChange={(v) => setIntentType(v as IntentType)}>
                  <TabsList className="grid w-full grid-cols-4 bg-muted">
                    <TabsTrigger value="email">Email</TabsTrigger>
                    <TabsTrigger value="task">Task</TabsTrigger>
                    <TabsTrigger value="reminder">Reminder</TabsTrigger>
                    <TabsTrigger value="chat">Chat</TabsTrigger>
                  </TabsList>
                </Tabs>

                {/* Input Textarea */}
                {step === 'input' && (
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Describe what you want to do (e.g., 'Send an email to the team about the weekly meeting at 2pm')"
                      value={intent}
                      onChange={(e) => setIntent(e.target.value)}
                      className="min-h-32 bg-input text-foreground placeholder:text-muted-foreground"
                      disabled={isAIPaused}
                    />
                    <Button 
                      onClick={generatePreview} 
                      disabled={!intent.trim() || loading || isAIPaused} 
                      className="w-full"
                    >
                      {loading ? 'Generating preview...' : 'Generate Preview'}
                    </Button>
                  </div>
                )}

                {/* Preview Section */}
                {step !== 'input' && preview && explainability && (
                  <div className="space-y-6">
                    <IntentPreview
                      preview={preview}
                      intentType={intentType}
                      loading={loading}
                      onConfirm={executeIntent}
                      onEdit={() => setStep('input')}
                    />

                    {/* AI Explainability Section */}
                    <Collapsible open={showExplainability} onOpenChange={setShowExplainability}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                          <div className="flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-primary" />
                            <span className="font-medium">Why this AI decision?</span>
                          </div>
                          {showExplainability ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 mt-4">
                        <Card className="border-primary/20 bg-primary/5">
                          <CardContent className="p-4 space-y-4">
                            {/* Confidence Score */}
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">AI Confidence</span>
                              <div className="flex items-center gap-2">
                                {(() => {
                                  const Icon = getConfidenceIcon(explainability.confidence);
                                  return <Icon className={`w-4 h-4 ${getConfidenceColor(explainability.confidence)}`} />;
                                })()}
                                <span className={`font-medium ${getConfidenceColor(explainability.confidence)}`}>
                                  {Math.round(explainability.confidence * 100)}%
                                </span>
                              </div>
                            </div>

                            {/* Reasoning */}
                            <div>
                              <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                <Info className="w-3 h-3" />
                                AI Reasoning
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {explainability.reasoning}
                              </p>
                            </div>

                            {/* Alternatives */}
                            <div>
                              <h4 className="text-sm font-medium mb-2">Alternative Approaches</h4>
                              <ul className="text-sm text-muted-foreground space-y-1">
                                {explainability.alternatives.map((alt, idx) => (
                                  <li key={idx} className="flex items-start gap-2">
                                    <span className="text-primary">•</span>
                                    {alt}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Risks */}
                            {explainability.risks.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-3 h-3 text-yellow-500" />
                                  Potential Risks
                                </h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {explainability.risks.map((risk, idx) => (
                                    <li key={idx} className="flex items-start gap-2">
                                      <span className="text-yellow-500">!</span>
                                      {risk}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Estimated Time */}
                            <div className="flex items-center justify-between pt-2 border-t border-border">
                              <span className="text-sm font-medium">Estimated Execution Time</span>
                              <div className="flex items-center gap-1 text-sm text-primary">
                                <Zap className="w-3 h-3" />
                                {explainability.estimatedTime}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Enhanced Activity Timeline */}
            <EnhancedActivityTimeline refreshKey={refreshKey} />

            {/* Weekly Reflection */}
            <WeeklyReflection />
          </div>
        </main>
      </div>
    </div>
  );
}
