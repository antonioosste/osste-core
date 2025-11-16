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
  Volume2,
  ChevronDown,
  ChevronUp
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTurns } from "@/hooks/useTurns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { generateChapters } from "@/lib/backend-api";

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
  topic?: string | null;
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
  const [currentPrompt, setCurrentPrompt] = useState("");
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationOpen, setConversationOpen] = useState(true);
  
  // Waveform animation
  const [waveformData, setWaveformData] = useState<number[]>(new Array(20).fill(0));
  const intervalRef = useRef<NodeJS.Timeout>();
  
  // Conversation scroll reference
  const conversationEndRef = useRef<HTMLDivElement>(null);

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
            const suggestions = turn.follow_up_suggestions 
              ? (Array.isArray(turn.follow_up_suggestions) 
                  ? turn.follow_up_suggestions as string[]
                  : [])
              : undefined;
            
            loadedMessages.push({
              id: `ai-${turn.id}`,
              type: "ai",
              content: turn.prompt_text,
              timestamp: new Date(turn.created_at || Date.now()),
              ttsUrl: null,
              recordingId: turn.recording_id || undefined,
              suggestions: suggestions,
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
        
        // Set the last AI prompt as current and load its suggestions
        const lastAiMessage = loadedMessages.reverse().find(m => m.type === 'ai');
        if (lastAiMessage) {
          setCurrentPrompt(lastAiMessage.content);
          
          // If the last AI message has suggestions, load them
          if (lastAiMessage.suggestions) {
            setSuggestedQuestions(lastAiMessage.suggestions);
          }
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

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
        if (questions.length > 0 && !currentPrompt) {
          setCurrentPrompt(questions[0]);
        }
      }
      // Non-guided mode: follow-up questions come from turn upload response only
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
      
      // Refetch turns to update conversation history
      await refetchTurns();
      
      // Extract data from backend response
      const transcriptionText = result.transcript?.text || result.turn?.answer_text;
      
      // New unified API structure
      const mainQuestion = result.follow_up?.question; // Main question (synthesized to TTS)
      const alternativeQuestions = result.follow_up?.suggestions || []; // Alternative questions
      const ttsUrl = result.follow_up?.tts_url;
      const topic = result.follow_up?.topic || null;
      
      console.log('🎵 TTS URL from response:', ttsUrl);
      console.log('📋 Main question:', mainQuestion);
      console.log('📋 Alternative questions:', alternativeQuestions);
      console.log('🏷️ Topic:', topic);
      
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
      
      // Add AI message with main question
      if (mainQuestion) {
        const aiMessageId = `ai-${Date.now()}`;
        
        setMessages((prev) => [
          ...prev,
          {
            id: aiMessageId,
            type: "ai",
            content: mainQuestion,
            timestamp: new Date(),
            ttsUrl: ttsUrl || null,
            isResolvingTts: false,
            recordingId: result.recording_id,
            suggestions: alternativeQuestions.length > 0 ? alternativeQuestions : undefined,
            topic: topic
          },
        ]);

        // Update prompt with main question
        setCurrentPrompt(mainQuestion);
        
        // Store alternative questions in QuestionSwitcher for manual selection
        setSuggestedQuestions(alternativeQuestions);

        // Auto-play TTS if available, otherwise resolve it with a small delay
        if (ttsUrl) {
          console.log('🔊 Auto-playing TTS audio from follow_up.tts_url');
          // Small delay to ensure message is rendered
          setTimeout(() => {
            playAudio(aiMessageId, ttsUrl).catch(error => {
              console.error('❌ TTS auto-play failed:', error);
              toast({
                title: "Auto-play failed",
                description: "Click the audio icon to play the response.",
                variant: "default"
              });
            });
          }, 100);
        } else if (result.recording_id) {
          console.log('🔄 TTS URL not ready, resolving from database...');
          resolveTtsForMessage(aiMessageId, result.recording_id, { autoplay: true });
        } else {
          console.warn('⚠️ No TTS URL or recording ID available');
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
      console.log('🎵 Playing audio for message:', messageId, 'URL:', ttsUrl);
      
      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setPlayingAudioId(messageId);
      
      const audio = new Audio(ttsUrl);
      audioRef.current = audio;

      audio.onended = () => {
        console.log('✅ Audio playback ended');
        setPlayingAudioId(null);
        audioRef.current = null;
      };

      audio.onerror = (err) => {
        console.error("❌ TTS playback error:", err);
        setPlayingAudioId(null);
        audioRef.current = null;
        toast({
          title: "Playback failed",
          description: "Failed to play audio response.",
          variant: "destructive"
        });
      };

      // Play with error handling
      try {
        await audio.play();
        console.log('✅ Audio playback started successfully');
      } catch (playError) {
        console.error('❌ Audio play() failed:', playError);
        throw playError;
      }
    } catch (err) {
      console.error("❌ Error playing TTS audio:", err);
      setPlayingAudioId(null);
      audioRef.current = null;
      throw err;
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
      
      {/* Main Session Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-4xl mx-auto w-full flex flex-col h-full px-4">
          
          {/* Minimalistic Header */}
          <div className="flex items-center justify-between py-4 border-b border-border/50 flex-shrink-0">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-medium text-foreground">Recording Session</h1>
              {getStatusBadge()}
              <span className="text-sm text-muted-foreground tabular-nums">{formatTime(sessionTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelAndExit}
                disabled={isGeneratingChapters}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveAndExit}
                disabled={isGeneratingChapters}
              >
                {isGeneratingChapters ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Saving
                  </>
                ) : (
                  'Save & Exit'
                )}
              </Button>
            </div>
          </div>

          {/* Central Recording Control - Top Section */}
          <div className="flex flex-col items-center py-6 flex-shrink-0 border-b border-border/30">
            {/* Error States */}
            {hasNetworkError && (
              <div className="mb-6 p-4 rounded-lg border border-destructive/50 bg-destructive/5 max-w-md w-full">
                <div className="flex items-center space-x-3">
                  <WifiOff className="w-5 h-5 text-destructive" />
                  <div className="flex-1">
                    <h3 className="font-medium text-sm text-foreground">Connection Lost</h3>
                    <p className="text-xs text-muted-foreground">Unable to connect to the server.</p>
                  </div>
                  <Button onClick={retryConnection} size="sm" variant="outline">Retry</Button>
                </div>
              </div>
            )}

            {/* Large Microphone Button */}
            <div className="relative mb-4">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className={`w-32 h-32 rounded-full shadow-lg hover:shadow-xl transition-all ${
                  isRecording ? 'animate-pulse' : 'hover:scale-105'
                }`}
                onClick={isRecording ? handleStopRecording : startRecording}
                disabled={micPermission === "denied" || hasNetworkError || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-12 h-12" />
                ) : (
                  <Mic className="w-12 h-12" />
                )}
              </Button>
              {micPermission === "denied" && (
                <div className="absolute top-0 right-0">
                  <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                    <MicOff className="w-4 h-4 text-destructive-foreground" />
                  </div>
                </div>
              )}
            </div>

            {/* Current Question Display */}
            <div className="text-center max-w-xl mb-4">
              <p className="text-sm text-muted-foreground/80 leading-relaxed">
                {currentPrompt}
              </p>
            </div>

            {/* Waveform - Only show when recording */}
            {isRecording && (
              <div className="flex items-center justify-center space-x-1 h-12 mb-4">
                {waveformData.map((height, index) => (
                  <div
                    key={index}
                    className="w-1 bg-primary rounded-full transition-all duration-100"
                    style={{ height: `${Math.max(4, height / 2)}px` }}
                  />
                ))}
              </div>
            )}

            {/* Recording Actions */}
            {isRecording && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  cancelRecording();
                  setStatus("idle");
                  toast({
                    title: "Recording cancelled",
                    description: "Your recording has been discarded."
                  });
                }}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 mb-4"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel Recording
              </Button>
            )}

            {/* AI Thinking Animation - Shows when processing */}
            {status === "thinking" && !isRecording && (
              <div className="w-full max-w-2xl animate-fade-in mb-4">
                <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-muted/20 shadow-xl backdrop-blur-sm">
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                  
                  <div className="relative p-6 flex items-center justify-center gap-4">
                    <div className="flex space-x-2">
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" />
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI-Inspired Follow-up Suggestions - Directly below Record Button */}
            {messages.length > 0 && messages[messages.length - 1]?.suggestions && !isRecording && status !== "thinking" && (
              <div className="w-full max-w-2xl animate-fade-in mb-4">
                <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-card via-card to-muted/20 shadow-xl backdrop-blur-sm">
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                  
                  <div className="relative p-6">
                    {/* Header with AI indicator */}
                    <div className="flex items-center gap-3 mb-5">
                      <div className="relative">
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                        <div className="absolute inset-0 w-2 h-2 rounded-full bg-primary animate-ping" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground/80">
                          Suggested Next Steps
                        </h3>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
                          AI-generated follow-up questions
                        </p>
                      </div>
                    </div>
                    
                    {/* Suggestions List */}
                    <div className="space-y-2">
                      {messages[messages.length - 1].suggestions!.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => {
                            setCurrentPrompt(suggestion);
                            toast({
                              title: "Question selected",
                              description: "Ready to record your answer"
                            });
                          }}
                          className="group w-full text-left p-4 rounded-xl border border-border/30 bg-background/50 hover:bg-accent/10 hover:border-accent/40 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold mt-0.5 group-hover:bg-primary/20 transition-colors">
                              {index + 1}
                            </div>
                            <p className="flex-1 text-sm text-foreground leading-relaxed font-medium">
                              {suggestion}
                            </p>
                            <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                                <span className="text-primary text-xs">→</span>
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Options - Minimalistic */}
            <div className="flex items-center justify-center gap-4 text-xs">
              {sessionMode === 'guided' && suggestedQuestions.length > 0 && (
                <details className="group">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors list-none">
                    <span className="flex items-center gap-2">
                      Browse Questions
                      <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
                    </span>
                  </summary>
                  <div className="absolute z-10 mt-2 p-4 rounded-lg border border-border bg-card shadow-lg min-w-[300px]">
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

              {sessionId && (
                <details className="group">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground transition-colors list-none">
                    <span className="flex items-center gap-2">
                      Add Photos
                      <span className="text-xs group-open:rotate-180 transition-transform">▼</span>
                    </span>
                  </summary>
                  <div className="absolute z-10 mt-2 p-4 rounded-lg border border-border bg-card shadow-lg">
                    <SessionImageUploader
                      sessionId={sessionId}
                      currentPrompt={currentPrompt}
                      userId={user?.id}
                    />
                  </div>
                </details>
              )}
            </div>
          </div>

          {/* Conversation History - Collapsible Section */}
          <Collapsible
            open={conversationOpen}
            onOpenChange={setConversationOpen}
            className="flex-shrink-0"
          >
            <div className="relative overflow-hidden group">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative flex items-center justify-between py-4 px-2 border-b border-border/40 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {/* Chat icon with subtle animation */}
                  <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors duration-200">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                      className="text-primary"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Conversation History</h3>
                    {/* Message count badge */}
                    {messages.filter(m => !m.isPartial).length > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-primary-foreground bg-primary rounded-full animate-scale-in">
                        {messages.filter(m => !m.isPartial).length}
                      </span>
                    )}
                  </div>
                </div>
                
                <CollapsibleTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 hover:bg-primary/10 transition-all duration-200 group/button"
                  >
                    <div className={`transition-transform duration-300 ${conversationOpen ? 'rotate-180' : 'rotate-0'}`}>
                      <ChevronDown className="h-4 w-4 group-hover/button:text-primary transition-colors" />
                    </div>
                  </Button>
                </CollapsibleTrigger>
              </div>
            </div>
            
            <CollapsibleContent>
              <div className="overflow-y-auto py-4 max-h-[25vh] conversation-history-scroll">
                <div className="space-y-6">
                  {messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Start recording to begin your conversation</p>
                    </div>
                  ) : (
                    <>
                  {messages.filter(m => !m.isPartial).map((message) => (
                    <div key={message.id} className="space-y-2">
                      {/* Message */}
                      <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`flex items-start gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : ""}`}>
                          <div
                            className={`rounded-2xl px-4 py-3 ${
                              message.type === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted/50 text-foreground border border-border/50"
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{message.content}</p>
                            
                            {/* Topic badge for AI messages */}
                            {message.type === "ai" && message.topic && (
                              <div className="mt-2">
                                <Badge variant="secondary" className="text-[10px] px-2 py-0.5">
                                  {message.topic}
                                </Badge>
                              </div>
                            )}
                            
                            <div className="text-xs opacity-60 mt-2">
                              {message.timestamp.toLocaleTimeString([], { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                          
                          {/* Audio Playback */}
                          {message.type === "ai" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 flex-shrink-0 opacity-50 hover:opacity-100"
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
                            >
                              {playingAudioId === message.id || message.isResolvingTts ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Volume2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}

                          {message.type === "user" && message.recordingPath && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 w-7 p-0 flex-shrink-0 opacity-50 hover:opacity-100"
                              onClick={() => {
                                if (message.recordingPath) {
                                  playAudio(message.id, message.recordingPath);
                                }
                              }}
                              disabled={playingAudioId === message.id}
                            >
                              {playingAudioId === message.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Volume2 className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              <div ref={conversationEndRef} />
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
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