import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  Mic, 
  MicOff, 
  Square, 
  Save,
  X,
  WifiOff,
  AlertCircle,
  Loader2,
  Volume2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { QuestionSwitcher } from "@/components/ui/question-switcher";
import { SessionImageUploader } from "@/components/ui/session-image-uploader";
import { SessionModeSelector } from "@/components/session/SessionModeSelector";
import { ConversationSkeleton } from "@/components/loaders/ConversationSkeleton";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTurns } from "@/hooks/useTurns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateChapters, getFollowUpQuestions } from "@/lib/backend-api";

type SessionStatus = "idle" | "listening" | "thinking" | "speaking" | "paused" | "error";
type PermissionState = "granted" | "denied" | "pending" | "prompt";

interface Message {
  id: string;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
  isPartial?: boolean;
  ttsUrl?: string | null;
  recordingPath?: string;
  recordingId?: string;
  turnId?: string;
  isResolvingTts?: boolean;
  suggestions?: string[];
}

export default function Session() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingSessionId = searchParams.get('id');
  
  const { toast } = useToast();
  const { user } = useAuth();
  const { sessionId, startSession: startSessionDb, endSession, loadSession } = useSession(existingSessionId);
  const { 
    isRecording, 
    isProcessing, 
    startRecording: startAudioRecording, 
    stopRecording, 
    uploadAndProcess,
    cancelRecording 
  } = useAudioRecorder(sessionId);
  const { turns, loading: turnsLoading, refetch: refetchTurns } = useTurns(sessionId || undefined);
  
  // Core session state
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [sessionTime, setSessionTime] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState("Tell me about your earliest childhood memory. What stands out most vividly?");
  const [isLoadingSession, setIsLoadingSession] = useState(!!existingSessionId);
  
  // Session mode state
  const [showModeSelector, setShowModeSelector] = useState(!existingSessionId);
  const [sessionMode, setSessionMode] = useState<'guided' | 'non-guided'>('guided');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  
  // Permission and error states
  const [micPermission, setMicPermission] = useState<PermissionState>("prompt");
  const [hasNetworkError, setHasNetworkError] = useState(false);
  
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [isGeneratingChapters, setIsGeneratingChapters] = useState(false);
  
  // Conversation state
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      type: "ai",
      content: "Hello! I'm here to help you capture your stories. Let's start with your earliest childhood memory - what stands out most vividly to you?",
      timestamp: new Date()
    }
  ]);
  
  // Waveform animation
  const [waveformData, setWaveformData] = useState<number[]>(new Array(20).fill(0));
  const intervalRef = useRef<NodeJS.Timeout>();

  // TTS audio playback
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [resolvingTtsIds, setResolvingTtsIds] = useState<Set<string>>(new Set());

  // Load existing session data on mount
  useEffect(() => {
    const loadExistingSession = async () => {
      if (existingSessionId && turns.length > 0) {
        setIsLoadingSession(true);
        console.log('📥 Loading existing session:', existingSessionId);
        
        // Fetch session data to get mode
        const { data: sessionData } = await supabase
          .from('sessions')
          .select('mode, themes')
          .eq('id', existingSessionId)
          .single();
        
        if (sessionData) {
          const mode = sessionData.mode as 'guided' | 'non-guided' | null;
          const loadedMode = mode === 'non-guided' ? 'non-guided' : 'guided';
          setSessionMode(loadedMode);
          
          let category: string | undefined;
          if (sessionData.themes && sessionData.themes.length > 0) {
            category = sessionData.themes[0];
            setSelectedCategory(category);
          }
          setShowModeSelector(false);
          
          // Load questions for the session mode
          await loadQuestions(loadedMode, category);
        }
        
        // Load turns into messages
        const loadedMessages: Message[] = [{
          id: "welcome",
          type: "ai",
          content: "Welcome back! Let's continue your story.",
          timestamp: new Date()
        }];

        for (const turn of turns) {
          // Add AI prompt
          if (turn.prompt_text) {
            loadedMessages.push({
              id: `ai-${turn.id}`,
              type: "ai",
              content: turn.prompt_text,
              timestamp: new Date(turn.created_at || Date.now()),
              ttsUrl: null,
              recordingId: turn.recording_id || undefined,
            });
          }

          // Add user answer
          if (turn.answer_text) {
            loadedMessages.push({
              id: `user-${turn.id}`,
              type: "user",
              content: turn.answer_text,
              timestamp: new Date(turn.created_at || Date.now()),
              recordingPath: turn.recording_id || undefined,
            });
          }
        }

        setMessages(loadedMessages);
        
        // Set the last AI prompt as current
        const lastAiMessage = loadedMessages.reverse().find(m => m.type === 'ai');
        if (lastAiMessage) {
          setCurrentPrompt(lastAiMessage.content);
        }

        toast({
          title: "Session loaded",
          description: "Continuing from where you left off.",
        });
        
        setIsLoadingSession(false);
      } else if (existingSessionId && !turnsLoading && turns.length === 0) {
        // Session exists but has no turns yet
        setIsLoadingSession(false);
      }
    };

    loadExistingSession();
  }, [existingSessionId, turns, turnsLoading]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Waveform animation effect
  useEffect(() => {
    if (status === "listening") {
      intervalRef.current = setInterval(() => {
        setWaveformData(prev => 
          prev.map(() => Math.random() * 100)
        );
      }, 100);
    } else {
      clearInterval(intervalRef.current);
      setWaveformData(new Array(20).fill(0));
    }
    return () => clearInterval(intervalRef.current);
  }, [status]);

  // Mock prompts rotation
  const prompts = [
    "Tell me about your earliest childhood memory. What stands out most vividly?",
    "What was your hometown like when you were growing up?",
    "Can you describe your parents and what they were like?",
    "What was school like for you? Do you have any favorite teachers or subjects?",
    "Tell me about your first job or career. How did you get started?"
  ];

  const requestMicPermission = async () => {
    try {
      setMicPermission("pending");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
      setShowPermissionDialog(false);
      stream.getTracks().forEach(track => track.stop()); // Stop the test stream
      toast({
        title: "Microphone access granted",
        description: "You can now start recording your story."
      });
    } catch (error) {
      setMicPermission("denied");
      setShowPermissionDialog(true);
    }
  };

  // TTS resolver with polling
  const resolveTtsForMessage = async (
    messageId: string, 
    recordingId: string, 
    options: { autoplay?: boolean } = {}
  ) => {
    console.log('🔄 Starting TTS resolution for message:', messageId, 'recordingId:', recordingId);
    
    setResolvingTtsIds(prev => new Set(prev).add(messageId));
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isResolvingTts: true } : m
    ));

    for (let attempt = 0; attempt < 20; attempt++) {
      try {
        const { data, error } = await supabase
          .from('turns')
          .select('tts_audio_path')
          .eq('recording_id', recordingId)
          .maybeSingle();

        console.log(`🔍 Attempt ${attempt + 1}/20 - TTS path:`, data?.tts_audio_path);

        if (error) {
          console.error('❌ Error fetching turns:', error);
          break;
        }

        const path = data?.tts_audio_path;
        if (path) {
          console.log('✅ Found TTS path, creating signed URL:', path);
          
          const { data: signed, error: signErr } = await supabase.storage
            .from('recordings')
            .createSignedUrl(path, 3600);

          if (!signErr && signed?.signedUrl) {
            console.log('🎵 TTS signed URL created successfully:', signed.signedUrl);
            
            setMessages(prev => prev.map(m => 
              m.id === messageId ? { ...m, ttsUrl: signed.signedUrl, isResolvingTts: false } : m
            ));
            setResolvingTtsIds(prev => {
              const next = new Set(prev);
              next.delete(messageId);
              return next;
            });

            if (options.autoplay) {
              console.log('🔊 Auto-playing TTS audio');
              playAudio(messageId, signed.signedUrl);
            }
            return;
          }
          
          console.error('❌ Error creating signed URL:', signErr);
          break;
        }

        // Wait before next attempt with gentle backoff
        await new Promise(r => setTimeout(r, 1500 + attempt * 250));
      } catch (err) {
        console.error('❌ Exception during TTS resolution:', err);
        break;
      }
    }

    console.log('⏱️ TTS resolution timed out or failed for message:', messageId);
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isResolvingTts: false } : m
    ));
    setResolvingTtsIds(prev => {
      const next = new Set(prev);
      next.delete(messageId);
      return next;
    });
    
    toast({
      title: "Audio not ready yet",
      description: "The AI audio is still being generated. Please try again in a moment.",
      variant: "default",
    });
  };

  const handleModeSelect = async (mode: 'guided' | 'non-guided', category?: string) => {
    setSessionMode(mode);
    setSelectedCategory(category);
    setShowModeSelector(false);

    // Start session in database with selected mode
    try {
      await startSessionDb({
        persona: 'friendly',
        themes: category ? [category] : [],
        language: 'en',
        mode: mode,
        category: category
      });
      
      // Load questions based on mode
      await loadQuestions(mode, category);
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const loadQuestions = async (mode: 'guided' | 'non-guided', category?: string) => {
    setIsLoadingQuestions(true);
    try {
      if (mode === 'guided' && category) {
        // Fetch questions from database based on category
        const { data, error } = await supabase.functions.invoke('get-questions', {
          body: { category, limit: 10 }
        });

        if (error) throw error;
        
        const questions = data?.map((q: any) => q.question) || [];
        setSuggestedQuestions(questions);
        
        // Set first question as current
        if (questions.length > 0) {
          setCurrentPrompt(questions[0]);
        }
      } else if (mode === 'non-guided' && sessionId) {
        // Fetch AI-generated follow-up questions from backend
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        
        if (!token) {
          throw new Error('No authentication token available');
        }

        const data = await getFollowUpQuestions(token, sessionId);
        
        // Backend returns: { questions: string[], active_question: string }
        const questions = data?.questions || [];
        const activeQuestion = data?.active_question;
        
        setSuggestedQuestions(questions);
        
        // Set active question as current prompt
        if (activeQuestion) {
          setCurrentPrompt(activeQuestion);
        } else if (questions.length > 0) {
          setCurrentPrompt(questions[0]);
        }
      }
    } catch (error) {
      console.error('Error loading questions:', error);
      toast({
        title: "Failed to load questions",
        description: error instanceof Error ? error.message : "Could not load questions",
        variant: "destructive"
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const startRecording = async () => {
    if (micPermission !== "granted") {
      await requestMicPermission();
      return;
    }

    // Start session in database if not already started
    if (!sessionId) {
      // This shouldn't happen if mode selector works correctly
      try {
        await startSessionDb({
          persona: 'friendly',
          themes: selectedCategory ? [selectedCategory] : [],
          language: 'en',
          mode: sessionMode
        });
      } catch (error) {
        console.error('Error starting session:', error);
        return;
      }
    }

    try {
      await startAudioRecording();
      setStatus("listening");
    } catch (error) {
      console.error('Failed to start recording:', error);
      setStatus("error");
    }
  };

  const handleStopRecording = async () => {
    try {
      setStatus("thinking");
      
      // Stop recording and get blob
      const recording = await stopRecording();
      
      // Add user message placeholder (recordingPath set after upload completes)
      const userMsgId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: userMsgId,
        type: "user",
        content: "Processing your response...",
        timestamp: new Date(),
        isPartial: true
      }]);
      
      // Upload and process (triggers transcription + AI response + TTS)
      const result = await uploadAndProcess(recording, currentPrompt);
      console.log('📋 Turn created:', result);
      
      // Extract data from backend response
      const transcriptionText = result.transcript?.text || result.turn?.answer_text;
      
      // Handle both response formats from AI service:
      // - { questions: [...] } when prompt_text is provided
      // - { topic: "...", follow_up_suggestions: [...] } when prompt_text is NOT provided
      const suggestions = result.follow_up?.questions || result.follow_up?.follow_up_suggestions || result.follow_up?.suggestions || [];
      const ttsUrl = result.follow_up?.tts_url;
      const firstSuggestion = suggestions[0];
      
      if (transcriptionText) {
        // Update user message with transcription and attach actual storage path
        setMessages(prev => prev.map(msg => 
          msg.id === userMsgId 
            ? { ...msg, content: transcriptionText, isPartial: false, recordingPath: result.storage_path }
            : msg
        ));
      } else {
        // Even without transcription, attach storage path and finalize message
        setMessages(prev => prev.map(msg => 
          msg.id === userMsgId 
            ? { ...msg, isPartial: false, recordingPath: result.storage_path }
            : msg
        ));
      }
      
      // Add AI message with TTS URL and inline suggestions
      if (firstSuggestion) {
        const aiMessageId = `ai-${Date.now()}`;
        
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            type: "ai",
            content: firstSuggestion,
            timestamp: new Date(),
            ttsUrl: ttsUrl || null,
            isResolvingTts: !ttsUrl,
            recordingId: result.recording_id,
            suggestions: suggestions.length > 0 ? suggestions : undefined
          },
        ]);

        // Update prompt with first suggestion
        setCurrentPrompt(firstSuggestion);
        
        // Also store in QuestionSwitcher for manual selection
        setSuggestedQuestions(suggestions);

        // Auto-play TTS if available, otherwise resolve it
        if (ttsUrl) {
          console.log('🔊 Playing TTS audio from follow_up.tts_url');
          playAudio(aiMessageId, ttsUrl);
        } else if (result.recording_id) {
          console.log('🔄 TTS URL not ready, resolving from database...');
          resolveTtsForMessage(aiMessageId, result.recording_id, { autoplay: true });
        }
      }
      
      setStatus("idle");
      
      toast({
        title: "Turn completed",
        description: "Your response has been processed successfully."
      });

    } catch (error) {
      console.error('❌ Failed to process recording:', error);
      setStatus("error");
      setHasNetworkError(true);
      
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process your recording",
        variant: "destructive"
      });
    }
  };


  const playAudio = async (messageId: string, ttsUrl: string) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setPlayingAudioId(messageId);
      
      const audio = new Audio(ttsUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
        audioRef.current = null;
      };

      audio.onerror = (err) => {
        console.error("TTS playback error:", err);
        setPlayingAudioId(null);
        audioRef.current = null;
        toast({
          title: "Playback failed",
          description: "Failed to play audio response.",
          variant: "destructive"
        });
      };

      await audio.play();
    } catch (err) {
      console.error("Error playing TTS audio:", err);
      setPlayingAudioId(null);
      audioRef.current = null;
    }
  };

  const playRecording = async (messageId: string, recordingPath: string) => {
    try {
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setPlayingAudioId(messageId);

      console.log('🎵 Attempting to play recording:', recordingPath);

      // Get signed URL from Supabase Storage (valid for 1 hour)
      const { data, error } = await supabase.storage
        .from('recordings')
        .createSignedUrl(recordingPath, 3600);

      if (error) {
        console.error('❌ Error creating signed URL:', error);
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error('No signed URL returned');
      }

      console.log('✅ Signed URL created:', data.signedUrl);

      const audio = new Audio(data.signedUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setPlayingAudioId(null);
        audioRef.current = null;
      };

      audio.onerror = (err) => {
        console.error("Recording playback error:", err);
        setPlayingAudioId(null);
        audioRef.current = null;
        toast({
          title: "Playback failed",
          description: "Failed to play recording.",
          variant: "destructive"
        });
      };

      await audio.play();
    } catch (err) {
      console.error("Error playing recording:", err);
      setPlayingAudioId(null);
      audioRef.current = null;
      toast({
        title: "Playback failed",
        description: "Failed to load recording.",
        variant: "destructive"
      });
    }
  };

  const cancelAndExit = () => {
    if (isRecording) {
      cancelRecording();
    }
    
    toast({
      title: "Session cancelled",
      description: "Exiting without saving."
    });
    
    navigate("/dashboard");
  };

  const saveAndExit = async () => {
    if (isRecording) {
      cancelRecording();
    }
    
    if (sessionId) {
      try {
        // End the session first
        await endSession(sessionId);
        
        // Generate chapters for the session
        setIsGeneratingChapters(true);
        
        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;
          
          if (!token) {
            throw new Error('No authentication token available');
          }
          
          console.log('🔄 Generating chapters for session:', sessionId);
          await generateChapters(token, sessionId);
          
          toast({
            title: "Session saved",
            description: "Your recording session and chapters have been generated successfully."
          });
        } catch (chapterError) {
          console.error('Error generating chapters:', chapterError);
          toast({
            title: "Session saved",
            description: "Session saved, but chapter generation failed. You can retry later.",
            variant: "default"
          });
        } finally {
          setIsGeneratingChapters(false);
        }
      } catch (error) {
        console.error('Error saving session:', error);
        toast({
          title: "Save failed",
          description: "Failed to save session, but your recordings are stored.",
          variant: "destructive"
        });
      }
    }
    navigate("/dashboard");
  };

  const retryConnection = () => {
    setHasNetworkError(false);
    setStatus("idle");
    toast({
      title: "Reconnecting...",
      description: "Attempting to restore connection."
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    if (isProcessing) {
      return (
        <Badge variant="secondary" className="animate-pulse">
          Processing
        </Badge>
      );
    }

    const statusConfig = {
      idle: { variant: "secondary" as const, text: "Ready" },
      listening: { variant: "default" as const, text: "Listening" },
      thinking: { variant: "secondary" as const, text: "Thinking" },
      speaking: { variant: "default" as const, text: "Speaking" },
      paused: { variant: "outline" as const, text: "Paused" },
      error: { variant: "destructive" as const, text: "Error" }
    };
    
    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className="animate-pulse">
        {config.text}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header isAuthenticated={true} />

      {/* Full Screen Loading Animation */}
      {isLoadingSession && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 animate-fade-in">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-foreground">Loading your session...</p>
              <p className="text-sm text-muted-foreground">Preparing your conversation</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Session Mode Selector Dialog */}
      <SessionModeSelector 
        open={showModeSelector} 
        onSelect={handleModeSelect}
        onClose={() => setShowModeSelector(false)}
      />
      
      {/* Single Column Scrollable Layout */}
      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-4 max-w-4xl space-y-4">
          {/* Compact Sticky Header */}
          <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm pb-2">
            <Card className="border-primary/20">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h1 className="text-base font-semibold text-foreground">Voice Interview</h1>
                    {getStatusBadge()}
                    <span className="text-sm text-muted-foreground">{formatTime(sessionTime)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelAndExit}
                      disabled={isGeneratingChapters}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onClick={saveAndExit}
                      disabled={isGeneratingChapters}
                    >
                      {isGeneratingChapters ? (
                        <>
                          <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-3 h-3 mr-1" />
                          Save & Exit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recording Controls - Collapsible when not in use */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                {/* Microphone Button */}
                <div className="relative">
                  <Button
                    size="lg"
                    variant={isRecording ? "destructive" : "default"}
                    className={`w-20 h-20 rounded-full ${isRecording ? 'animate-pulse' : ''}`}
                    onClick={isRecording ? handleStopRecording : startRecording}
                    disabled={micPermission === "denied" || hasNetworkError || isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="w-7 h-7 animate-spin" />
                    ) : isRecording ? (
                      <Square className="w-7 h-7" />
                    ) : (
                      <Mic className="w-7 h-7" />
                    )}
                  </Button>
                  {micPermission === "denied" && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-5 h-5 bg-destructive rounded-full flex items-center justify-center">
                        <MicOff className="w-3 h-3 text-destructive-foreground" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Waveform - Only show when recording */}
                {isRecording && (
                  <div className="flex items-center justify-center space-x-1 h-12">
                    {waveformData.map((height, index) => (
                      <div
                        key={index}
                        className="bg-primary rounded-full transition-all duration-100"
                        style={{
                          width: '3px',
                          height: `${Math.max(3, height * 0.5)}px`
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Recording Controls */}
                {isRecording && (
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        cancelRecording();
                        setStatus("idle");
                        toast({
                          title: "Recording cancelled",
                          description: "Your recording has been discarded."
                        });
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel Recording
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error States */}
          {hasNetworkError && (
            <Card className="border-destructive/50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <WifiOff className="w-5 h-5 text-destructive" />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-foreground">Connection Lost</h3>
                    <p className="text-xs text-muted-foreground">Unable to connect to the server.</p>
                  </div>
                  <Button onClick={retryConnection} size="sm">Retry</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Question Switcher - Collapsible */}
          {suggestedQuestions.length > 0 && (
            <details className="group" open>
              <summary className="cursor-pointer list-none">
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Browse All Questions</span>
                      <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                    </div>
                  </CardContent>
                </Card>
              </summary>
              <div className="mt-2">
                <QuestionSwitcher
                  question={currentPrompt}
                  onQuestionChange={setCurrentPrompt}
                  topic={selectedCategory}
                  hideTopicSelector={true}
                  questions={suggestedQuestions}
                  isLoadingQuestions={isLoadingQuestions}
                />
              </div>
            </details>
          )}

          {/* Image Uploader - Collapsible */}
          {sessionId && (
            <details className="group">
              <summary className="cursor-pointer list-none">
                <Card className="hover:border-primary/40 transition-colors">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-foreground">Add Photos/Context</span>
                      <span className="text-xs text-muted-foreground group-open:rotate-180 transition-transform">▼</span>
                    </div>
                  </CardContent>
                </Card>
              </summary>
              <div className="mt-2">
                <SessionImageUploader
                  sessionId={sessionId}
                  currentPrompt={currentPrompt}
                  userId={user?.id}
                />
              </div>
            </details>
          )}

          {/* Conversation Thread - Main Focus */}
          <Card>
            <CardHeader className="border-b border-border pb-3">
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No messages yet. Start recording to begin your conversation.</p>
                  </div>
                ) : (
                  <>
                    {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    {/* Message Bubble */}
                    <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`flex items-start gap-2 max-w-[85%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                        <div
                          className={`rounded-lg p-3 ${
                            message.type === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm leading-relaxed">{message.content}</p>
                          <div className="text-xs opacity-70 mt-1">
                            {message.timestamp.toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        
                        {/* Audio Playback Buttons */}
                        {message.type === "ai" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 flex-shrink-0"
                            onClick={() => {
                              if (message.ttsUrl) {
                                playAudio(message.id, message.ttsUrl);
                              } else if (message.recordingId && !message.isResolvingTts) {
                                toast({
                                  title: "Loading audio",
                                  description: "We'll play it as soon as it's ready.",
                                });
                                resolveTtsForMessage(message.id, message.recordingId, { autoplay: true });
                              }
                            }}
                            disabled={playingAudioId === message.id || message.isResolvingTts}
                            title={
                              message.isResolvingTts 
                                ? "Audio is generating..." 
                                : message.ttsUrl 
                                ? "Play AI response audio" 
                                : "Load and play audio"
                            }
                          >
                            {playingAudioId === message.id || message.isResolvingTts ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Volume2 className="h-4 w-4 text-primary" />
                            )}
                          </Button>
                        )}

                        {message.type === "user" && message.recordingPath && !message.isPartial && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 flex-shrink-0"
                            onClick={() => playRecording(message.id, message.recordingPath!)}
                            disabled={playingAudioId === message.id}
                          >
                            {playingAudioId === message.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Volume2 className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* AI Suggestions - Inline after AI messages */}
                    {message.type === "ai" && message.suggestions && message.suggestions.length > 0 && (
                      <div className="pl-10">
                        <div className="bg-accent/30 border border-primary/20 rounded-lg p-3">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Follow-up suggestions:</p>
                          <div className="flex flex-wrap gap-2">
                            {message.suggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                className="text-xs h-auto py-2 px-3 bg-background hover:bg-primary hover:text-primary-foreground transition-colors"
                                onClick={() => {
                                  setCurrentPrompt(suggestion);
                                  toast({
                                    title: "Question selected",
                                    description: "Ready to record your answer"
                                  });
                                }}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                    </div>
                  ))}
                  
                  {/* Thinking Indicator */}
                  {status === "thinking" && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      </div>
                      </div>
                    </div>
                  )}
                </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Microphone Permission Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Microphone Permission Required
            </DialogTitle>
            <DialogDescription>
              To record your stories, we need access to your microphone. Please grant permission when prompted by your browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={requestMicPermission}>
              Request Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}