import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { createTurn } from '@/lib/backend-api';

interface RecordingResult {
  blob: Blob;
  duration: number;
  mimeType: string;
}

export function useAudioRecorder(sessionId: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        title: "Recording failed",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  const stopRecording = useCallback((): Promise<RecordingResult> => {
    return new Promise((resolve, reject) => {
      const mediaRecorder = mediaRecorderRef.current;
      
      if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        reject(new Error('No active recording'));
        return;
      }

      mediaRecorder.onstop = () => {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        
        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        setIsRecording(false);
        resolve({
          blob,
          duration,
          mimeType: mediaRecorder.mimeType,
        });
      };

      mediaRecorder.stop();
    });
  }, []);

  const uploadAndProcess = useCallback(async (
    recording: RecordingResult,
    promptText?: string
  ) => {
    if (!user || !sessionId) {
      throw new Error('User not authenticated or no active session');
    }

    setIsProcessing(true);

    try {
      // Get JWT token
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token available');
      }

      // Create storage path
      const timestamp = Date.now();
      const extension = recording.mimeType.includes('webm') ? 'webm' : 'mp4';
      const storagePath = `${user.id}/${sessionId}/${timestamp}.${extension}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(storagePath, recording.blob, {
          contentType: recording.mimeType,
          cacheControl: '3600',
        });

      if (uploadError) throw uploadError;

      // Notify backend and trigger full turn processing
      const result = await createTurn(accessToken, {
        sessionId,
        storagePath,
        durationSeconds: recording.duration,
        mimeType: recording.mimeType,
        language: 'en',
        prompt_text: promptText,
        synthesize_tts: true,
      });

      toast({
        title: "Recording uploaded",
        description: "AI is processing your response...",
      });

      return result;

    } catch (error) {
      console.error('Error uploading recording:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload recording",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [user, sessionId, toast]);

  const cancelRecording = useCallback(() => {
    const mediaRecorder = mediaRecorderRef.current;
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      mediaRecorder.stop();
      setIsRecording(false);
      chunksRef.current = [];
    }
  }, []);

  return {
    isRecording,
    isProcessing,
    startRecording,
    stopRecording,
    uploadAndProcess,
    cancelRecording,
  };
}
