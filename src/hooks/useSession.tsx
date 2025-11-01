import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

interface SessionParams {
  persona?: string;
  themes?: string[];
  language?: string;
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

  const startSession = async (params: SessionParams = {}) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to start a session.",
        variant: "destructive",
      });
      throw new Error("User not authenticated");
    }

    try {
      setLoading(true);

      // Try backend endpoint first if available
      const backendUrl = (window as any).__BACKEND_START_SESSION_URL || '/api/start-session';
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        if (accessToken) {
          const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            },
            body: JSON.stringify({
              persona: params.persona || 'friendly',
              themes: params.themes || [],
              language: params.language || 'en'
            })
          });

          if (response.ok) {
            const data = await response.json();
            setSessionId(data.session_id);
            toast({
              title: "Session started",
              description: "Your recording session is now active.",
            });
            return data.session_id;
          }
        }
      } catch (backendError) {
        console.log('Backend endpoint not available, falling back to direct insert');
      }

      // Fallback: Direct Supabase insert
      const { data, error: insertError } = await supabase
        .from('sessions')
        .insert({
          user_id: user.id,
          persona: params.persona || 'friendly',
          themes: params.themes || [],
          language: params.language || 'en',
          status: 'active',
          started_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setSessionId(data.id);
      toast({
        title: "Session started",
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

      setSessionId(null);
      toast({
        title: "Session ended",
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
