import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';
import { sendRecordingStartedEmail, sendRecordingFinishedEmail } from '@/lib/emails';

/**
 * SessionParams for creating a new session (Chapter Recording)
 * 
 * TITLE HIERARCHY for chapters:
 * - Session.title: User-editable title (highest priority when displaying)
 * - Chapter.suggested_cover_title: AI-suggested title
 * - Session.story_anchor: The prompt/question used to start the recording
 * - Chapter.title: AI-generated chapter title
 * - Fallback: "Recording {date}"
 * 
 * Data Hierarchy:
 * User -> Story Group (Book) -> Session (Chapter Recording) -> Chapter
 * 
 * IMPORTANT: story_group_id is REQUIRED when creating a session.
 * Each session must belong to a Story Group (Book).
 */
interface SessionParams {
  story_group_id: string; // REQUIRED - Book ID
  persona?: string;
  themes?: string[];
  language?: string;
  mode?: 'guided' | 'non-guided';
  category?: string;
}

export function useSession(initialSessionId?: string | null) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [loading, setLoading] = useState(false);

  const loadSession = async (id: string) => {
    setSessionId(id);
    return id;
  };

  /**
   * Start a new session (Chapter Recording)
   * 
   * @param params - Session parameters including REQUIRED story_group_id
   * @returns The created session ID
   */
  const startSession = async (params: SessionParams) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to start a session.",
        variant: "destructive",
      });
      throw new Error("User not authenticated");
    }

    if (!params.story_group_id) {
      toast({
        title: "Book required",
        description: "Please select a book first.",
        variant: "destructive",
      });
      throw new Error("Story group ID (Book) is required");
    }

    try {
      setLoading(true);

      // Create session with story_group_id linkage
      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          story_group_id: params.story_group_id,
          persona: params.persona || 'friendly',
          themes: params.themes || [],
          language: params.language || 'en',
          mode: params.mode || 'guided',
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSessionId(data.id);
      
      // Send recording started email (non-blocking)
      if (user.email) {
        sendRecordingStartedEmail({
          email: user.email,
          firstName: user.user_metadata?.name || undefined,
          sessionId: data.id,
        });
      }
      
      toast({
        title: "Chapter recording started",
        description: "Your recording session is now active.",
      });
      return data.id;
    } catch (err) {
      toast({
        title: "Error starting session",
        description: err instanceof Error ? err.message : "Failed to start session",
        variant: "destructive",
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const endSession = async (id?: string) => {
    const targetId = id || sessionId;
    if (!targetId) return;

    try {
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          status: 'completed',
          ended_at: new Date().toISOString()
        })
        .eq('id', targetId);

      if (updateError) throw updateError;

      // Send recording finished email (non-blocking)
      if (user?.email) {
        sendRecordingFinishedEmail({
          email: user.email,
          firstName: user.user_metadata?.name || undefined,
          sessionId: targetId,
        });
      }

      setSessionId(null);
      toast({
        title: "Chapter recording ended",
        description: "Your recording has been saved.",
      });
    } catch (err) {
      toast({
        title: "Error ending session",
        description: err instanceof Error ? err.message : "Failed to end session",
        variant: "destructive",
      });
      throw err;
    }
  };

  return {
    sessionId,
    loading,
    startSession,
    endSession,
    loadSession,
  };
}
