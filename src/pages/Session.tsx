import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Mic, 
  MicOff, 
  Square, 
  Play, 
  Pause,
  Save,
  X,
  Volume2,
  WifiOff,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Header } from "@/components/layout/Header";
import { useToast } from "@/hooks/use-toast";
import { useSession } from "@/hooks/useSession";

type SessionStatus = "idle" | "listening" | "thinking" | "speaking" | "paused" | "error";
type PermissionState = "granted" | "denied" | "pending" | "prompt";

interface Message {
  id: string;
  type: "ai" | "user";
  content: string;
  timestamp: Date;
  isPartial?: boolean;
}

export default function Session() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { sessionId, startSession: startSessionDb, endSession } = useSession();
  
  // Core session state
  const [status, setStatus] = useState<SessionStatus>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);
  const [currentPrompt, setCurrentPrompt] = useState("Tell me about your earliest childhood memory. What stands out most vividly?");
  
  // Permission and error states
  const [micPermission, setMicPermission] = useState<PermissionState>("prompt");
  const [hasNetworkError, setHasNetworkError] = useState(false);
  const [showEndDialog, setShowEndDialog] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  
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

  const startRecording = async () => {
    if (micPermission !== "granted") {
      await requestMicPermission();
      return;
    }

    // Start session in database if not already started
    if (!sessionId) {
      try {
        await startSessionDb({
          persona: 'friendly',
          themes: ['family', 'memories'],
          language: 'en'
        });
      } catch (error) {
        console.error('Error starting session:', error);
        return;
      }
    }

    setIsRecording(true);
    setStatus("listening");
    
    // Simulate user speaking after 3 seconds
    setTimeout(() => {
      if (status === "listening") {
        setStatus("thinking");
        // Add user message
        const userMessage: Message = {
          id: Date.now().toString(),
          type: "user",
          content: "Well, I remember when I was about five years old, we lived in this small house with a big oak tree in the backyard...",
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Simulate AI processing
        setTimeout(() => {
          setStatus("speaking");
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            type: "ai",
            content: "That sounds like a wonderful memory! Can you tell me more about that oak tree and what made it special to you?",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, aiMessage]);
          
          // Move to next prompt
          setTimeout(() => {
            setStatus("idle");
            setCurrentPrompt(prompts[Math.floor(Math.random() * prompts.length)]);
          }, 3000);
        }, 2000);
      }
    }, 3000);
  };

  const stopRecording = () => {
    setIsRecording(false);
    setStatus("idle");
  };

  const handleEndSession = () => {
    setShowEndDialog(true);
  };

  const confirmEndSession = async () => {
    if (sessionId) {
      try {
        await endSession(sessionId);
      } catch (error) {
        console.error('Error ending session:', error);
      }
    }
    navigate("/dashboard");
  };

  const saveAndExit = async () => {
    if (sessionId) {
      try {
        await endSession(sessionId);
      } catch (error) {
        console.error('Error saving session:', error);
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
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header with current prompt */}
        <div className="mb-6">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-xl font-semibold text-foreground">Voice Interview Session</h1>
                <div className="flex items-center space-x-3">
                  {getStatusBadge()}
                  <div className="text-sm text-muted-foreground">
                    {formatTime(sessionTime)}
                  </div>
                </div>
              </div>
              <p className="text-lg text-foreground leading-relaxed">
                {currentPrompt}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Recording Controls - Left/Top */}
          <div className="lg:col-span-2 space-y-6">
            {/* Main Recording Interface */}
            <Card>
              <CardContent className="p-8">
                <div className="flex flex-col items-center space-y-6">
                  {/* Microphone Button */}
                  <div className="relative">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "default"}
                      className={`w-24 h-24 rounded-full ${isRecording ? 'animate-pulse' : 'hover-scale'}`}
                      onClick={isRecording ? stopRecording : startRecording}
                      disabled={micPermission === "denied" || hasNetworkError}
                    >
                      {isRecording ? (
                        <Square className="w-8 h-8" />
                      ) : (
                        <Mic className="w-8 h-8" />
                      )}
                    </Button>
                    {micPermission === "denied" && (
                      <div className="absolute -top-2 -right-2">
                        <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center">
                          <MicOff className="w-3 h-3 text-destructive-foreground" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Waveform Visualization */}
                  <div className="flex items-center justify-center space-x-1 h-16">
                    {waveformData.map((height, index) => (
                      <div
                        key={index}
                        className="bg-primary rounded-full transition-all duration-100"
                        style={{
                          width: '4px',
                          height: `${Math.max(4, height * 0.6)}px`
                        }}
                      />
                    ))}
                  </div>

                  {/* Controls */}
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEndSession}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="w-4 h-4 mr-2" />
                      End Session
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={saveAndExit}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save & Exit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Error States */}
            {hasNetworkError && (
              <Card className="border-destructive/50">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3">
                    <WifiOff className="w-6 h-6 text-destructive" />
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground">Connection Lost</h3>
                      <p className="text-sm text-muted-foreground">
                        Unable to connect to the server. Please check your internet connection.
                      </p>
                    </div>
                    <Button onClick={retryConnection} size="sm">
                      Retry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Conversation Thread - Right/Bottom */}
          <div className="lg:col-span-1">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-lg">Conversation</CardTitle>
              </CardHeader>
              <CardContent className="p-4 max-h-96 lg:max-h-[600px] overflow-y-auto">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.type === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className="text-xs opacity-70 mt-1">
                          {message.timestamp.toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                  
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* End Session Confirmation Dialog */}
      <Dialog open={showEndDialog} onOpenChange={setShowEndDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Session?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end this recording session? Your progress will be saved automatically.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndDialog(false)}>
              Continue Session
            </Button>
            <Button onClick={confirmEndSession}>
              End Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Microphone Permission Dialog */}
      <Dialog open={showPermissionDialog} onOpenChange={setShowPermissionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Microphone Access Required</DialogTitle>
            <DialogDescription>
              To record your story, we need access to your microphone. Please allow microphone access when prompted by your browser.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
            <AlertCircle className="w-5 h-5 text-muted-foreground" />
            <div className="text-sm text-muted-foreground">
              Click "Allow" in your browser's permission dialog to continue.
            </div>
          </div>
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