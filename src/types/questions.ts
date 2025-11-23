export type QuestionCategory =
  | "Childhood & Early Memories"
  | "Family & Home Life"
  | "School & Teenage Years"
  | "First Love & Relationships"
  | "Friendships & Community"
  | "Work, Career & Purpose"
  | "Hardship, Loss & Healing"
  | "Triumphs & Turning Points"
  | "Travel, Adventure & Discovery"
  | "Passions, Hobbies & Joy"
  | "Values, Beliefs & Reflections"
  | "Parenthood & Family of Choice"
  | "Dreams, Future & Aspirations"
  | "Life Lessons & Wisdom"
  | "Health, Body & Wellbeing"
  | "Identity, Culture & Belonging"
  | "Money, Home & Lifestyle"
  | "Migration & New Beginnings"
  | "Entrepreneurship & Ambition"
  | "Faith, Philosophy & Meaning"
  | "Military, Service & Duty"
  | "Technology, Modern Life & Social Media";

export interface QuestionRow {
  id: string;
  category_id: string | null;
  question_text: string;
  persona_tags: string[] | null;
  difficulty: number | null;
  order_index: number | null;
  active: boolean | null;
  created_at: string | null;
}

export function parseEmotionTags(row: QuestionRow): string[] {
  return row.persona_tags || [];
}

export function parseFollowupTypes(row: QuestionRow): string[] {
  // Followup types are not in the current schema
  return [];
}

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  "Childhood & Early Memories",
  "Family & Home Life",
  "School & Teenage Years",
  "First Love & Relationships",
  "Friendships & Community",
  "Work, Career & Purpose",
  "Hardship, Loss & Healing",
  "Triumphs & Turning Points",
  "Travel, Adventure & Discovery",
  "Passions, Hobbies & Joy",
  "Values, Beliefs & Reflections",
  "Parenthood & Family of Choice",
  "Dreams, Future & Aspirations",
  "Life Lessons & Wisdom",
  "Health, Body & Wellbeing",
  "Identity, Culture & Belonging",
  "Money, Home & Lifestyle",
  "Migration & New Beginnings",
  "Entrepreneurship & Ambition",
  "Faith, Philosophy & Meaning",
  "Military, Service & Duty",
  "Technology, Modern Life & Social Media",
];
