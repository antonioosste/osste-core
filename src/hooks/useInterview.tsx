import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: number;
  category: string;
  question: string;
  emotion_tags: string;
  followup_type: string;
  depth_level: number;
  locale_variant: string;
}

interface FollowupTemplate {
  id: number;
  type: string;
  prompt: string;
}

export const useInterview = () => {
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentDepth, setCurrentDepth] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchInitialQuestion = useCallback(async ({
    category,
    depth_level = 1
  }: {
    category?: string;
    depth_level?: number;
  }) => {
    setLoading(true);
    try {
      let query = supabase
        .from('questions')
        .select('*')
        .eq('depth_level', depth_level);

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;

      if (data && data.length > 0) {
        // Pick random question
        const randomIndex = Math.floor(Math.random() * data.length);
        setCurrentQuestion(data[randomIndex]);
        setCurrentDepth(depth_level);
      }
    } catch (error) {
      console.error('Error fetching question:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const getFollowups = useCallback(async (types: string[]): Promise<string[]> => {
    try {
      const { data, error } = await supabase
        .from('followup_templates')
        .select('*')
        .in('type', types);

      if (error) throw error;

      if (!data || data.length === 0) return [];

      // Return 1-2 random prompts per type
      const prompts: string[] = [];
      types.forEach(type => {
        const typePrompts = data.filter(d => d.type === type);
        if (typePrompts.length > 0) {
          // Pick 1-2 random
          const count = Math.min(2, typePrompts.length);
          for (let i = 0; i < count; i++) {
            const randomIndex = Math.floor(Math.random() * typePrompts.length);
            prompts.push(typePrompts[randomIndex].prompt);
            typePrompts.splice(randomIndex, 1);
          }
        }
      });

      return prompts;
    } catch (error) {
      console.error('Error fetching followups:', error);
      return [];
    }
  }, []);

  const getBiasedFollowupTypes = useCallback((
    detectedEmotion?: string,
    category?: string
  ): string[] => {
    // Bias follow-up types based on emotion/category
    if (detectedEmotion === 'grief' || category === 'Hardship, Loss & Healing') {
      return ['repair', 'grounding', 'reflection'];
    }

    if (category === 'Childhood & Early Memories') {
      return ['sensory', 'timeline'];
    }

    // Default follow-up types from current question
    if (currentQuestion?.followup_type) {
      return currentQuestion.followup_type.split('|');
    }

    return ['narrative', 'why_how'];
  }, [currentQuestion]);

  const escalateDepth = useCallback(async (category: string) => {
    if (currentDepth < 3) {
      await fetchInitialQuestion({
        category,
        depth_level: currentDepth + 1
      });
    }
  }, [currentDepth, fetchInitialQuestion]);

  return {
    currentQuestion,
    currentDepth,
    loading,
    fetchInitialQuestion,
    getFollowups,
    getBiasedFollowupTypes,
    escalateDepth
  };
};