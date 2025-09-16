import { useState, useEffect } from "react";
import { Mic, MicOff, Square, Play, Pause, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";

type SessionState = "idle" | "recording" | "processing" | "completed";

const sampleQuestions = [
  "Tell me about your earliest childhood memory.",
  "What was your neighborhood like when you were growing up?",
  "Who was the most influential person in your early life?",
  "What family traditions did you have growing up?",
  "Tell me about a time when you overcame a significant challenge.",
];

export default function Session() {
  const [sessionState, setSessionState] = useState<SessionState>("idle");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [isListening, setIsListening] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (sessionState === "recording") {
      interval = setInterval(() => {
        setSessionDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionState]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setSessionState("recording");
    setIsListening(true);
  };

  const handleStopRecording = () => {
    setSessionState("processing");
    setIsListening(false);
    
    // Simulate processing
    setTimeout(() => {
      setSessionState("completed");
    }, 2000);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const progress = ((currentQuestion + 1) / sampleQuestions.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header isAuthenticated={true} />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Session Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Voice Interview Session
          </h1>
          <p className="text-muted-foreground mb-4">
            Answer questions naturally - our AI will capture every detail
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Badge variant="secondary">
              Question {currentQuestion + 1} of {sampleQuestions.length}
            </Badge>
            <Badge variant="outline">
              {formatTime(sessionDuration)}
            </Badge>
          </div>
        </div>

        {/* Progress */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </CardContent>
        </Card>

        {/* Current Question */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Volume2 className="w-5 h-5 mr-2" />
              Current Question
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg text-foreground mb-4">
              {sampleQuestions[currentQuestion]}
            </p>
            <p className="text-sm text-muted-foreground">
              Take your time and speak naturally. The AI will ask follow-up questions based on your response.
            </p>
          </CardContent>
        </Card>

        {/* Recording Controls */}
        <Card className="mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col items-center">
              {/* Main Record Button */}
              <div className="relative mb-6">
                <Button
                  size="lg"
                  className={`w-24 h-24 rounded-full text-white ${
                    sessionState === "recording" 
                      ? "bg-red-500 hover:bg-red-600 animate-pulse" 
                      : "bg-primary hover:bg-primary/90"
                  }`}
                  onClick={sessionState === "recording" ? handleStopRecording : handleStartRecording}
                  disabled={sessionState === "processing"}
                >
                  {sessionState === "recording" ? (
                    <Square className="w-8 h-8" />
                  ) : sessionState === "processing" ? (
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </Button>
                
                {/* Listening Indicator */}
                {isListening && (
                  <div className="absolute -inset-2 rounded-full border-2 border-red-400 animate-ping" />
                )}
              </div>

              {/* Status Text */}
              <p className="text-center text-muted-foreground mb-4">
                {sessionState === "idle" && "Click to start recording your answer"}
                {sessionState === "recording" && "Recording... Click to stop"}
                {sessionState === "processing" && "Processing your response..."}
                {sessionState === "completed" && "Response captured successfully!"}
              </p>

              {/* Secondary Controls */}
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  disabled={sessionState !== "completed"}
                  onClick={handleNextQuestion}
                >
                  Next Question
                </Button>
                <Button
                  variant="outline"
                  disabled={sessionState === "recording"}
                >
                  Skip Question
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Session Type</p>
              <p className="font-semibold text-foreground">Life Stories</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Estimated Time</p>
              <p className="font-semibold text-foreground">30-45 minutes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-sm text-muted-foreground">Audio Quality</p>
              <div className="flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-1" />
                <p className="font-semibold text-foreground">Excellent</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}