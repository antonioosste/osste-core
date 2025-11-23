import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface Question {
  id: string;
  category_id: string | null;
  question_text: string;
  persona_tags: string[] | null;
  difficulty: number | null;
  order_index: number | null;
  active: boolean | null;
  created_at: string | null;
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
        .eq('active', true);

      if (category && category !== 'All') {
        query = query.eq('category_id', category);
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
    // Return mock followup prompts based on type
    const followupTemplates: Record<string, string[]> = {
      'repair': [
        'How did that experience shape who you are today?',
        'What helped you get through that difficult time?'
      ],
      'grounding': [
        'Can you describe what you were feeling in that moment?',
        'What stands out most vividly in your memory?'
      ],
      'reflection': [
        'Looking back, what did you learn from that experience?',
        'What would you tell someone going through something similar?'
      ],
      'sensory': [
        'What do you remember seeing, hearing, or smelling?',
        'Can you describe the setting in more detail?'
      ],
      'timeline': [
        'What happened next?',
        'How did things unfold from there?'
      ],
      'narrative': [
        'Tell me more about that.',
        'What else do you remember?'
      ],
      'why_how': [
        'Why do you think that happened?',
        'How did that make you feel?'
      ]
    };

    const prompts: string[] = [];
    types.forEach(type => {
      const typePrompts = followupTemplates[type] || followupTemplates['narrative'];
      const count = Math.min(2, typePrompts.length);
      for (let i = 0; i < count; i++) {
        if (typePrompts[i]) prompts.push(typePrompts[i]);
      }
    });

    return prompts;
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

    // Default follow-up types
    return ['narrative', 'why_how'];
  }, []);

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