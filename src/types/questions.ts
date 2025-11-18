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
  id: number;
  category: QuestionCategory;
  question: string;
  emotion_tags: string;      // pipe-separated
  followup_type: string;     // pipe-separated
  depth_level: number;       // 1, 2, or 3
  locale_variant: string;    // e.g. "en-US"
}

export function parseEmotionTags(row: QuestionRow): string[] {
  return row.emotion_tags.split("|").map(tag => tag.trim()).filter(Boolean);
}

export function parseFollowupTypes(row: QuestionRow): string[] {
  return row.followup_type.split("|").map(tag => tag.trim()).filter(Boolean);
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
