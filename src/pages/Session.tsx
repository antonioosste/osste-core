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
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Header } from "@/components/layout/Header";
import { QuestionSwitcher } from "@/components/ui/question-switcher";
import { CategorySelector } from "@/components/session/CategorySelector";
import { GuidedSetup } from "@/components/session/GuidedSetup";
import { ConversationSkeleton } from "@/components/loaders/ConversationSkeleton";
import { GeneratingOverlay } from "@/components/loaders/GeneratingOverlay";
import { getQuestionsByCategory, getRandomQuestion } from "@/lib/questions";
import type { QuestionRow, QuestionCategory } from "@/types/questions";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useTurns } from "@/hooks/useTurns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEntitlements } from "@/hooks/useEntitlements";
import { generateChapters } from "@/lib/backend-api";
import { useStoryGroups } from "@/hooks/useStoryGroups";

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
  suggestions?: string[];
  topic?: string | null;
}

interface GuidedPrompt {
  id: string;
  text: string;
  topic_id: string;
}

export default function Session() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const existingSessionId = searchParams.get("id");
  const bookIdParam = searchParams.get("bookId"); // Book ID to add chapter to
  const modeParam = searchParams.get("mode") as "guided" | "non-guided" | null;

  const { toast } = useToast();
  const { user } = useAuth();
  const { storyGroups, loading: storyGroupsLoading, createStoryGroup } = useStoryGroups();
  const { isRecordingLimitReached } = useEntitlements();
  const { sessionId, startSession: startSessionDb, endSession, loadSession } = useSession(existingSessionId);
  const {
    isRecording,
    isProcessing,
    startRecording: startAudioRecording,
    stopRecording,
    uploadAndProcess,
    cancelRecording,
  } = useAudioRecorder(sessionId);
  const { turns, loading: turnsLoading, refetch: refetchTurns } = useTurns(sessionId || undefined);

  // Book (story group) state - use bookIdParam if provided
  const [targetBookId, setTargetBookId] = useState<string | null>(bookIdParam);

  // Core session state
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [sessionTime, setSessionTime] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState("");
  const [isLoadingSession, setIsLoadingSession] = useState(!!existingSessionId);
  // Track if this is a session we created in this page visit (vs loading existing)
  const [isNewlyCreatedSession, setIsNewlyCreatedSession] = useState(false);

  // Session mode and question bank state
  const [showGuidedSetup, setShowGuidedSetup] = useState(!existingSessionId && !modeParam);
  const [sessionMode, setSessionMode] = useState<"guided" | "non-guided">(modeParam || "non-guided");
  const [guidedPrompts, setGuidedPrompts] = useState<GuidedPrompt[]>([]);
  const [currentGuidedPromptIndex, setCurrentGuidedPromptIndex] = useState(0);
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<QuestionCategory | undefined>();
  const [selectedDepth, setSelectedDepth] = useState<number>(2);
  const [questionBank, setQuestionBank] = useState<QuestionRow[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentQuestionData, setCurrentQuestionData] = useState<QuestionRow | null>(null);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [currentQuestionTtsUrl, setCurrentQuestionTtsUrl] = useState<string | null>(null);
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

  // Get or create target book for this chapter
  useEffect(() => {
    const getOrCreateTargetBook = async () => {
      // Wait for story groups to load before making decisions
      if (!user || targetBookId || storyGroupsLoading) return;

      // If bookIdParam was provided, use it directly
      if (bookIdParam) {
        setTargetBookId(bookIdParam);
        return;
      }

      // Only auto-select/create if user has no books AND came without a bookId
      // If user has books, don't auto-create - they should select one explicitly
      if (storyGroups.length > 0) {
        // Use the first book as default
        setTargetBookId(storyGroups[0].id);
      }
      // NOTE: We no longer auto-create books here.
      // Users must explicitly create books via "+ New Book" button
    };

    getOrCreateTargetBook();
  }, [user, storyGroups, storyGroupsLoading, targetBookId, bookIdParam]);

  // Start non-guided session automatically
  useEffect(() => {
    const startNonGuidedSession = async () => {
      if (modeParam === "non-guided" && !existingSessionId && !sessionId && targetBookId) {
        try {
          await startSessionDb({
            story_group_id: targetBookId,
            persona: "friendly",
            themes: [],
            language: "en",
            mode: "non-guided",
          });

          // Set initial prompt for non-guided
          setCurrentPrompt("Tell me a story from your life that's meaningful to you.");
        } catch (error) {
          console.error("Error starting chapter:", error);
        }
      }
    };

    startNonGuidedSession();
  }, [modeParam, existingSessionId, sessionId, targetBookId]);

  // Load existing session data on mount
  useEffect(() => {
    const loadExistingSession = async () => {
      if (existingSessionId && turns.length > 0) {
        setIsLoadingSession(true);
        console.log("📥 Loading existing session:", existingSessionId, "with", turns.length, "turns");

        // Fetch session data to get mode and story_group_id (for correct redirect)
        const { data: sessionData } = await supabase
          .from("sessions")
          .select("mode, themes, story_group_id")
          .eq("id", existingSessionId)
          .single();

        if (sessionData) {
          const mode = sessionData.mode as "guided" | "non-guided" | null;
          const loadedMode = mode === "non-guided" ? "non-guided" : "guided";
          setSessionMode(loadedMode);
          setShowGuidedSetup(false);

          // Set targetBookId from session's story_group_id for proper redirect
          if (sessionData.story_group_id && !targetBookId) {
            setTargetBookId(sessionData.story_group_id);
          }

          let category: QuestionCategory | undefined;
          if (sessionData.themes && sessionData.themes.length > 0) {
            category = sessionData.themes[0] as QuestionCategory;
            setSelectedCategory(category);
          }
          setShowCategorySelector(false);

          // Load questions for guided mode only
          if (loadedMode === "guided") {
            await loadQuestions(loadedMode, category);
          }
        }

        // Sort turns by turn_index to ensure proper ordering
        const sortedTurns = [...turns].sort((a, b) => {
          const indexA = a.turn_index || 0;
          const indexB = b.turn_index || 0;
          return indexA - indexB;
        });

        console.log("📋 Loading", sortedTurns.length, "turns in order");

        // Load turns into messages - NO welcome message for existing sessions
        const loadedMessages: Message[] = [];

        for (const turn of sortedTurns) {
          console.log("📝 Loading turn", turn.turn_index, ":", {
            prompt: turn.prompt_text?.substring(0, 50),
            answer: turn.answer_text?.substring(0, 50),
            stt: turn.stt_text?.substring(0, 50),
          });

          // Add AI prompt first if it exists
          if (turn.prompt_text) {
            const suggestions = turn.follow_up_suggestions
              ? Array.isArray(turn.follow_up_suggestions)
                ? (turn.follow_up_suggestions as string[])
                : []
              : undefined;

            // Get TTS URL if available
            let ttsUrl: string | null = null;
            if (turn.tts_audio_path) {
              const { data } = await supabase.storage.from("recordings").createSignedUrl(turn.tts_audio_path, 86400); // 24 hours
              ttsUrl = data?.signedUrl || null;
            }

            loadedMessages.push({
              id: `ai-${turn.id}`,
              type: "ai",
              content: turn.prompt_text,
              timestamp: new Date(turn.created_at || Date.now()),
              ttsUrl: ttsUrl,
              recordingId: turn.recording_id || undefined,
              suggestions: suggestions,
              turnId: turn.id,
            });
          }

          // Add user answer (use stt_text if answer_text is not available)
          const userText = turn.answer_text || turn.stt_text;
          if (userText) {
            loadedMessages.push({
              id: `user-${turn.id}`,
              type: "user",
              content: userText,
              timestamp: new Date(turn.created_at || Date.now()),
              recordingPath: turn.recording_id || undefined,
            });
          }
        }

        console.log("✅ Loaded", loadedMessages.length, "messages total");
        setMessages(loadedMessages);

        // Set the last AI prompt as current and load its suggestions
        const lastAiMessage = [...loadedMessages].reverse().find((m) => m.type === "ai");
        if (lastAiMessage) {
          setCurrentPrompt(lastAiMessage.content);

          // Set TTS URL for current question
          if (lastAiMessage.ttsUrl) {
            setCurrentQuestionTtsUrl(lastAiMessage.ttsUrl);
          }

          // If the last AI message has suggestions, load them
          if (lastAiMessage.suggestions) {
            setSuggestedQuestions(lastAiMessage.suggestions);
          }
        }

        toast({
          title: "Session loaded",
          description: `Loaded ${sortedTurns.length} conversation turns`,
        });

        setIsLoadingSession(false);
      } else if (existingSessionId && !turnsLoading && turns.length === 0) {
        // Session exists but has no turns - this is an orphaned session
        // Delete it and redirect back instead of showing CategorySelector
        setIsLoadingSession(false);
        
        try {
          await supabase
            .from('sessions')
            .delete()
            .eq('id', existingSessionId);
          
          console.log("🗑️ Deleted orphaned session:", existingSessionId);
          
          toast({
            title: "Empty session cleaned up",
            description: "Redirecting...",
          });
        } catch (error) {
          console.error("Error deleting orphaned session:", error);
        }
        
        // Navigate back to book or dashboard
        navigate(bookIdParam ? `/books/${bookIdParam}` : "/dashboard");
      }
    };

    loadExistingSession();
  }, [existingSessionId, turns, turnsLoading]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Waveform animation effect
  useEffect(() => {
    if (status === "listening") {
      intervalRef.current = setInterval(() => {
        setWaveformData((prev) => prev.map(() => Math.random() * 100));
      }, 100);
    } else {
      clearInterval(intervalRef.current);
      setWaveformData(new Array(20).fill(0));
    }
    return () => clearInterval(intervalRef.current);
  }, [status]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mock prompts rotation
  const prompts = [
    "Tell me about your earliest childhood memory. What stands out most vividly?",
    "What was your hometown like when you were growing up?",
    "Can you describe your parents and what they were like?",
    "What was school like for you? Do you have any favorite teachers or subjects?",
    "Tell me about your first job or career. How did you get started?",
  ];

  const requestMicPermission = async () => {
    try {
      setMicPermission("pending");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
      setShowPermissionDialog(false);
      stream.getTracks().forEach((track) => track.stop()); // Stop the test stream
      toast({
        title: "Microphone access granted",
        description: "You can now start recording your story.",
      });
    } catch (error) {
      setMicPermission("denied");
      setShowPermissionDialog(true);
    }
  };

  // TTS playback is now handled directly from API response
  // The backend returns follow_up.tts_url which is a signed URL ready for playback
  // No database polling needed

  const handleGuidedSetupComplete = async (starterQuestion: string) => {
    setShowGuidedSetup(false);
    setSessionMode("non-guided"); // Use non-guided flow after guidance

    if (!targetBookId) {
      toast({
        title: "Error",
        description: "Book not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Start chapter in database
    try {
      await startSessionDb({
        story_group_id: targetBookId,
        persona: "friendly",
        themes: [],
        language: "en",
        mode: "non-guided",
      });
      setIsNewlyCreatedSession(true);

      // Set the starter question from backend
      setCurrentPrompt(starterQuestion);

      toast({
        title: "Session started",
        description: "You can now start recording your response",
      });
    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Failed to start session",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleGuidedSetupSkip = async () => {
    setShowGuidedSetup(false);
    setSessionMode("non-guided");

    if (!targetBookId) {
      toast({
        title: "Error",
        description: "Book not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Start free recording chapter
    try {
      await startSessionDb({
        story_group_id: targetBookId,
        persona: "friendly",
        themes: [],
        language: "en",
        mode: "non-guided",
      });
      setIsNewlyCreatedSession(true);

      setCurrentPrompt("Tell me a story from your life that's meaningful to you.");

      toast({
        title: "Free recording mode",
        description: "Record your story without guidance",
      });
    } catch (error) {
      console.error("Error starting non-guided session:", error);
      toast({
        title: "Failed to start session",
        description: "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleCategorySelect = async (category: QuestionCategory | "surprise", depthLevel: number) => {
    setSessionMode("guided");
    setSelectedDepth(depthLevel);
    setShowCategorySelector(false);

    // If "surprise me", pick random category
    const finalCategory = category === "surprise" ? undefined : category;
    setSelectedCategory(finalCategory);

    if (!targetBookId) {
      toast({
        title: "Error",
        description: "Book not ready. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Start chapter in database
    try {
      await startSessionDb({
        story_group_id: targetBookId,
        persona: "friendly",
        themes: finalCategory ? [finalCategory] : [],
        language: "en",
        mode: "guided",
        category: finalCategory,
      });
      setIsNewlyCreatedSession(true);

      // Load questions
      await loadQuestions("guided", finalCategory, depthLevel);
    } catch (error) {
      console.error("Error starting session:", error);
    }
  };

  const loadQuestions = async (mode: "guided" | "non-guided", category?: QuestionCategory, depthLevel?: number) => {
    setIsLoadingQuestions(true);
    try {
      if (mode === "guided") {
        let questions: QuestionRow[];

        if (category) {
          // Fetch questions for specific category
          questions = await getQuestionsByCategory({
            category,
            depthLevelMax: depthLevel || selectedDepth,
          });
        } else {
          // Random question for "surprise me"
          const randomQ = await getRandomQuestion({
            depthLevelMax: depthLevel || selectedDepth,
          });
          questions = randomQ ? [randomQ] : [];
        }

        setQuestionBank(questions);
        setCurrentQuestionIndex(0);

        // Set first question as current
        if (questions.length > 0) {
          setCurrentQuestionData(questions[0]);
          setCurrentPrompt(questions[0].question_text);
        }
      }
    } catch (error) {
      console.error("Error loading questions:", error);
      toast({
        title: "Failed to load questions",
        description: error instanceof Error ? error.message : "Could not load questions",
        variant: "destructive",
      });
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questionBank.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      setCurrentQuestionData(questionBank[nextIndex]);
      setCurrentPrompt(questionBank[nextIndex].question_text);
    } else {
      // Load more questions or wrap around
      loadRandomQuestionForCategory();
    }
  };

  const loadRandomQuestionForCategory = async () => {
    try {
      const randomQ = await getRandomQuestion({
        category: selectedCategory,
        depthLevelMax: selectedDepth,
      });
      if (randomQ) {
        setCurrentQuestionData(randomQ);
        setCurrentPrompt(randomQ.question_text);
      }
    } catch (error) {
      console.error("Error loading random question:", error);
    }
  };

  const changeTopic = () => {
    setShowCategorySelector(true);
    setCurrentQuestionData(null);
    setCurrentPrompt("");
    setQuestionBank([]);
  };

  const startRecording = async () => {
    // Check account-level recording limit
    if (isRecordingLimitReached) {
      toast({
        title: "Recording limit reached",
        description: "You've reached your total recording limit for your current plan. Upgrade to get more recording time.",
        variant: "destructive",
      });
      return;
    }

    if (micPermission !== "granted") {
      await requestMicPermission();
      return;
    }

    // Start chapter in database if not already started
    if (!sessionId) {
      if (!targetBookId) {
        toast({
          title: "Error",
          description: "Book not ready. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // This shouldn't happen if mode selector works correctly
      try {
        await startSessionDb({
          story_group_id: targetBookId,
          persona: "friendly",
          themes: selectedCategory ? [selectedCategory] : [],
          language: "en",
          mode: sessionMode,
        });
      } catch (error) {
        console.error("Error starting session:", error);
        return;
      }
    }

    try {
      await startAudioRecording();
      setStatus("listening");
    } catch (error) {
      console.error("Failed to start recording:", error);
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
      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          type: "user",
          content: "Processing your response...",
          timestamp: new Date(),
          isPartial: true,
        },
      ]);

      // Upload and process (triggers transcription + AI response + TTS)
      const result = await uploadAndProcess(recording, currentPrompt);
      console.log("📋 Turn created:", result);

      // Refetch turns to update conversation history
      await refetchTurns();

      // Extract data from backend response
      const transcriptionText = result.transcript?.text || result.turn?.answer_text;

      // New unified API structure
      const mainQuestion = result.follow_up?.question; // Main question (synthesized to TTS)
      const alternativeQuestions = result.follow_up?.suggestions || []; // Alternative questions
      const ttsUrl = result.follow_up?.tts_url; // Available immediately in response
      const topic = result.follow_up?.topic || null;
      const turnId = result.turn?.id;

      console.log("🎵 TTS URL from response:", ttsUrl);
      console.log("📋 Main question:", mainQuestion);
      console.log("📋 Alternative questions:", alternativeQuestions);
      console.log("🏷️ Topic:", topic);

      if (transcriptionText) {
        // Update user message with transcription and attach actual storage path
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMsgId
              ? { ...msg, content: transcriptionText, isPartial: false, recordingPath: result.storage_path }
              : msg,
          ),
        );
      } else {
        // Even without transcription, attach storage path and finalize message
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === userMsgId ? { ...msg, isPartial: false, recordingPath: result.storage_path } : msg,
          ),
        );
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
            turnId: turnId,
            recordingId: result.recording_id,
            suggestions: alternativeQuestions.length > 0 ? alternativeQuestions : undefined,
            topic: topic,
          },
        ]);

        // Update prompt with main question
        setCurrentPrompt(mainQuestion);
        setCurrentQuestionTtsUrl(ttsUrl || null);

        // Store alternative questions in QuestionSwitcher for manual selection
        setSuggestedQuestions(alternativeQuestions);

        // Auto-play TTS audio (available immediately in response)
        if (ttsUrl) {
          console.log("🔊 Auto-playing TTS audio from follow_up.tts_url");
          setTimeout(() => {
            playAudio(aiMessageId, ttsUrl).catch((error) => {
              console.error("❌ TTS auto-play failed:", error);
              toast({
                title: "Auto-play failed",
                description: "Click the audio icon to play the response.",
                variant: "default",
              });
            });
          }, 100);
        }
      }

      setStatus("idle");

      toast({
        title: "Turn completed",
        description: "Your response has been processed successfully.",
      });
    } catch (error) {
      console.error("❌ Failed to process recording:", error);
      setStatus("error");
      setHasNetworkError(true);

      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "Failed to process your recording",
        variant: "destructive",
      });
    }
  };

  const playAudio = async (messageId: string, ttsUrl: string) => {
    try {
      console.log("🎵 Playing audio for message:", messageId, "URL:", ttsUrl);

      // Stop any currently playing audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      setPlayingAudioId(messageId);

      const audio = new Audio(ttsUrl);
      audioRef.current = audio;

      audio.onended = () => {
        console.log("✅ Audio playback ended");
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
          variant: "destructive",
        });
      };

      // Play with error handling
      try {
        await audio.play();
        console.log("✅ Audio playback started successfully");
      } catch (playError) {
        console.error("❌ Audio play() failed:", playError);
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

      console.log("🎵 Attempting to play recording:", recordingPath);

      // Get signed URL from Supabase Storage (valid for 1 hour)
      const { data, error } = await supabase.storage.from("recordings").createSignedUrl(recordingPath, 3600);

      if (error) {
        console.error("❌ Error creating signed URL:", error);
        throw error;
      }

      if (!data?.signedUrl) {
        throw new Error("No signed URL returned");
      }

      console.log("✅ Signed URL created:", data.signedUrl);

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
          variant: "destructive",
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
        variant: "destructive",
      });
    }
  };

  const cancelAndExit = async () => {
    if (isRecording) {
      cancelRecording();
    }

    // Only clean up sessions that we created in this page visit
    // Do NOT modify existing sessions the user was just viewing/continuing
    if (sessionId && isNewlyCreatedSession) {
      try {
        // Check if session has any turns
        const { data: sessionTurns } = await supabase
          .from('turns')
          .select('id')
          .eq('session_id', sessionId)
          .limit(1);
        
        if (!sessionTurns || sessionTurns.length === 0) {
          // No turns recorded - delete the empty session entirely
          await supabase
            .from('sessions')
            .delete()
            .eq('id', sessionId);
          console.log("🗑️ Deleted empty new session:", sessionId);
        } else {
          // New session has turns but cancelled - mark as cancelled
          await supabase
            .from('sessions')
            .update({ status: 'cancelled', ended_at: new Date().toISOString() })
            .eq('id', sessionId);
          console.log("❌ Marked new session as cancelled:", sessionId);
        }
      } catch (error) {
        console.error('Error cleaning up session:', error);
      }
    }

    toast({
      title: "Exited",
      description: "No changes were made.",
    });

    // Navigate back to the associated book if we know its ID, otherwise dashboard
    const redirectBookId = bookIdParam || targetBookId;
    navigate(redirectBookId ? `/books/${redirectBookId}` : "/dashboard");
  };

  const saveAndExit = async () => {
    if (isRecording) {
      cancelRecording();
    }

    if (sessionId) {
      try {
        // End the chapter first
        await endSession(sessionId);

        // Generate chapter content
        setIsGeneratingChapters(true);

        try {
          const session = await supabase.auth.getSession();
          const token = session.data.session?.access_token;

          if (!token) {
            throw new Error("No authentication token available");
          }

          console.log("🔄 Generating chapter content for:", sessionId);
          await generateChapters(token, sessionId);

          toast({
            title: "Chapter saved",
            description: "Your chapter has been saved successfully.",
          });
        } catch (chapterError) {
          console.error("Error generating chapter:", chapterError);
          toast({
            title: "Chapter saved",
            description: "Chapter saved, but content generation failed. You can retry later.",
            variant: "default",
          });
        } finally {
          setIsGeneratingChapters(false);
        }
      } catch (error) {
        console.error("Error saving chapter:", error);
        toast({
          title: "Save failed",
          description: "Failed to save chapter, but your recordings are stored.",
          variant: "destructive",
        });
      }
    }
    // Navigate back to the associated book if we know its ID, otherwise dashboard
    const redirectBookId = bookIdParam || targetBookId;
    navigate(redirectBookId ? `/books/${redirectBookId}` : "/dashboard");
  };

  const retryConnection = () => {
    setHasNetworkError(false);
    setStatus("idle");
    toast({
      title: "Reconnecting...",
      description: "Attempting to restore connection.",
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
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
      error: { variant: "destructive" as const, text: "Error" },
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

      {/* Chapter Generation Overlay */}
      <GeneratingOverlay 
        isVisible={isGeneratingChapters} 
        type="chapter" 
        title={currentQuestionData?.question_text || "Your recording"}
      />
      {showGuidedSetup && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="w-full py-8">
            <GuidedSetup onComplete={handleGuidedSetupComplete} onSkip={handleGuidedSetupSkip} />
          </div>
        </div>
      )}

      {/* Category Selector (Legacy - kept for existing sessions) */}
      {showCategorySelector && (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-4xl w-full">
            <CategorySelector onCategorySelected={handleCategorySelect} />
          </div>
        </div>
      )}

      {/* Main Session Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="max-w-4xl mx-auto w-full flex flex-col h-full px-4">
          {/* Minimalistic Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-4 border-b border-border/50 flex-shrink-0 gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
              <h1 className="text-base sm:text-lg font-medium text-foreground">Chapter Recording</h1>
              {getStatusBadge()}
              <span className="text-sm text-muted-foreground tabular-nums">{formatTime(sessionTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={cancelAndExit} disabled={isGeneratingChapters} className="min-h-[44px]">
                Cancel
              </Button>
              <Button size="sm" onClick={saveAndExit} disabled={isGeneratingChapters} className="min-h-[44px]">
                {isGeneratingChapters ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                    Saving
                  </>
                ) : (
                  "Save & Exit"
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
                  <Button onClick={retryConnection} size="sm" variant="outline">
                    Retry
                  </Button>
                </div>
              </div>
            )}

            {/* Large Microphone Button */}
            <div className="relative mb-4">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full shadow-lg hover:shadow-xl transition-all ${
                  isRecording ? "animate-pulse" : "hover:scale-105"
                }`}
                onClick={isRecording ? handleStopRecording : startRecording}
                disabled={micPermission === "denied" || hasNetworkError || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-12 h-12 animate-spin" />
                ) : isRecording ? (
                  <Square className="w-8 h-8 sm:w-12 sm:h-12" />
                ) : (
                  <Mic className="w-8 h-8 sm:w-12 sm:h-12" />
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
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground/60 font-medium">
                  Current Question
                </p>
                <div className="flex items-center justify-center gap-3 w-full">
                  <p className="text-base text-foreground leading-relaxed flex-1 font-medium">{currentPrompt}</p>
                  {currentQuestionTtsUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 flex-shrink-0"
                      onClick={() => {
                        if (currentQuestionTtsUrl) {
                          playAudio("current-question", currentQuestionTtsUrl);
                        }
                      }}
                      disabled={playingAudioId === "current-question"}
                    >
                      {playingAudioId === "current-question" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
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
                    description: "Your recording has been discarded.",
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
                      <div
                        className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2.5 h-2.5 bg-primary rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI-Inspired Follow-up Suggestions - Only show in non-guided mode */}
            {sessionMode === "non-guided" &&
              messages.length > 0 &&
              messages[messages.length - 1]?.suggestions &&
              !isRecording &&
              status !== "thinking" && (
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
                                description: "Ready to record your answer",
                              });
                            }}
                            className="group w-full text-left p-4 rounded-xl border border-border/30 bg-background/50 hover:bg-accent/10 hover:border-accent/40 transition-all duration-200 hover:shadow-md hover:scale-[1.02]"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold mt-0.5 group-hover:bg-primary/20 transition-colors">
                                {index + 1}
                              </div>
                              <p className="flex-1 text-sm text-foreground leading-relaxed font-medium">{suggestion}</p>
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

            {/* Additional Options - Mode-specific Navigation */}
            <div className="flex items-center justify-center gap-4 text-xs">
              {sessionMode === "guided" && guidedPrompts.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const nextIndex = currentGuidedPromptIndex + 1;
                      if (nextIndex < guidedPrompts.length) {
                        setCurrentGuidedPromptIndex(nextIndex);
                        setCurrentPrompt(guidedPrompts[nextIndex].text);
                        toast({
                          title: "Next question",
                          description: `Question ${nextIndex + 1} of ${guidedPrompts.length}`,
                        });
                      } else {
                        toast({
                          title: "All questions completed",
                          description: "You've gone through all selected questions",
                        });
                      }
                    }}
                    disabled={currentGuidedPromptIndex >= guidedPrompts.length - 1}
                    className="text-xs"
                  >
                    Next Question ({currentGuidedPromptIndex + 1}/{guidedPrompts.length})
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowGuidedSetup(true);
                      setGuidedPrompts([]);
                    }}
                    className="text-xs"
                  >
                    Change Topic
                  </Button>
                </>
              )}

              {sessionMode === "guided" && questionBank.length > 0 && guidedPrompts.length === 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={nextQuestion}
                    disabled={isLoadingQuestions}
                    className="text-xs"
                  >
                    Next Question
                  </Button>

                  <Button variant="ghost" size="sm" onClick={changeTopic} className="text-xs">
                    Change Topic
                  </Button>
                </>
              )}

            </div>
          </div>

          {/* Conversation History - Collapsible Section */}
          <Collapsible open={conversationOpen} onOpenChange={setConversationOpen} className="flex-shrink-0">
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
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">Conversation History</h3>
                    {/* Message count badge */}
                    {messages.filter((m) => !m.isPartial).length > 0 && (
                      <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-primary-foreground bg-primary rounded-full animate-scale-in">
                        {messages.filter((m) => !m.isPartial).length}
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
                    <div
                      className={`transition-transform duration-300 ${conversationOpen ? "rotate-180" : "rotate-0"}`}
                    >
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
                      {messages
                        .filter((m) => !m.isPartial)
                        .map((message) => (
                          <div key={message.id} className="space-y-2">
                            {/* Message */}
                            <div className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}>
                              <div
                                className={`flex items-start gap-3 max-w-[80%] ${message.type === "user" ? "flex-row-reverse" : ""}`}
                              >
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
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </div>
                                </div>
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
              To record your stories, we need access to your microphone. Please grant permission when prompted by your
              browser.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPermissionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={requestMicPermission}>Request Permission</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
