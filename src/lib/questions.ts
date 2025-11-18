import { supabase } from "@/integrations/supabase/client";
import type { QuestionRow, QuestionCategory } from "@/types/questions";

export async function getQuestionsByCategory(options: {
  category: QuestionCategory;
  locale?: string;
  depthLevelMax?: number;
}): Promise<QuestionRow[]> {
  const { category, locale = "en-US", depthLevelMax } = options;

  let query = supabase
    .from("questions")
    .select("*")
    .eq("category", category)
    .eq("locale_variant", locale)
    .order("depth_level", { ascending: true })
    .order("id", { ascending: true });

  if (depthLevelMax) {
    query = query.lte("depth_level", depthLevelMax);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching questions", error);
    return [];
  }
  return (data || []) as QuestionRow[];
}

export async function getRandomQuestion(options?: {
  category?: QuestionCategory;
  locale?: string;
  depthLevelMax?: number;
}): Promise<QuestionRow | null> {
  const { category, locale = "en-US", depthLevelMax } = options || {};

  let query = supabase
    .from("questions")
    .select("*")
    .eq("locale_variant", locale);

  if (category) {
    query = query.eq("category", category);
  }
  if (depthLevelMax) {
    query = query.lte("depth_level", depthLevelMax);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    console.error("Error fetching random question", error);
    return null;
  }

  // Simple random pick
  const idx = Math.floor(Math.random() * data.length);
  return data[idx] as QuestionRow;
}
