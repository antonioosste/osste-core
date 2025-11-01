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
    console.log('🎤 Starting recording...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      console.log('✅ Microphone access granted');

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';
      console.log('📝 Using mime type:', mimeType);

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      startTimeRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('📊 Audio chunk received, size:', event.data.size);
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start(1000); // Collect data every second
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
      console.log('✅ Recording started successfully');

    } catch (error) {
      console.error('❌ Error starting recording:', error);
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
    console.log('📤 Starting upload and process...', {
      hasUser: !!user,
      hasSessionId: !!sessionId,
      blobSize: recording.blob.size,
      duration: recording.duration,
      mimeType: recording.mimeType
    });

    if (!user || !sessionId) {
      const error = 'User not authenticated or no active session';
      console.error('❌', error);
      throw new Error(error);
    }

    setIsProcessing(true);

    try {
      // Get JWT token
      console.log('🔑 Getting JWT token...');
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;

      if (!accessToken) {
        throw new Error('No access token available');
      }
      console.log('✅ JWT token obtained');

      // Create storage path
      const timestamp = Date.now();
      const extension = recording.mimeType.includes('webm') ? 'webm' : 'mp4';
      const storagePath = `${user.id}/${sessionId}/${timestamp}.${extension}`;
      console.log('📁 Storage path:', storagePath);

      // Upload to Supabase Storage
      console.log('☁️ Uploading to Supabase Storage...');
      const { error: uploadError } = await supabase.storage
        .from('recordings')
        .upload(storagePath, recording.blob, {
          contentType: recording.mimeType,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('❌ Supabase upload error:', uploadError);
        throw uploadError;
      }
      console.log('✅ File uploaded to Supabase Storage');

      // Notify backend and trigger full turn processing
      console.log('🔄 Calling backend API...');
      const result = await createTurn(accessToken, {
        sessionId,
        storagePath,
        durationSeconds: recording.duration,
        mimeType: recording.mimeType,
        language: 'en',
        prompt_text: promptText,
        synthesize_tts: true,
      });
      console.log('✅ Backend API response:', result);

      toast({
        title: "Recording uploaded",
        description: "AI is processing your response...",
      });

      return result;

    } catch (error) {
      console.error('❌ Upload and process error:', error);
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
