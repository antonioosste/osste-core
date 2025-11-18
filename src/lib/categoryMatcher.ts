import type { QuestionCategory } from "@/types/questions";

interface CategoryKeywords {
  category: QuestionCategory;
  keywords: string[];
}

const CATEGORY_KEYWORDS: CategoryKeywords[] = [
  {
    category: "Childhood & Early Memories",
    keywords: ["childhood", "child", "kid", "young", "growing up", "early", "memories", "parents", "home", "family", "school days", "elementary"],
  },
  {
    category: "Family & Home Life",
    keywords: ["family", "home", "parents", "mother", "father", "siblings", "brother", "sister", "household", "domestic"],
  },
  {
    category: "School & Teenage Years",
    keywords: ["school", "teenage", "teen", "high school", "college", "university", "student", "education", "learning", "adolescent"],
  },
  {
    category: "First Love & Relationships",
    keywords: ["love", "romance", "relationship", "dating", "partner", "boyfriend", "girlfriend", "crush", "marriage", "wedding"],
  },
  {
    category: "Friendships & Community",
    keywords: ["friends", "friendship", "community", "social", "neighbors", "circle", "companions", "buddies"],
  },
  {
    category: "Work, Career & Purpose",
    keywords: ["work", "job", "career", "professional", "office", "boss", "employment", "profession", "vocation", "purpose"],
  },
  {
    category: "Hardship, Loss & Healing",
    keywords: ["hardship", "loss", "grief", "difficult", "challenge", "struggle", "healing", "overcome", "pain", "death"],
  },
  {
    category: "Triumphs & Turning Points",
    keywords: ["triumph", "success", "achievement", "milestone", "victory", "accomplishment", "turning point", "breakthrough"],
  },
  {
    category: "Travel, Adventure & Discovery",
    keywords: ["travel", "adventure", "journey", "explore", "discovery", "trip", "vacation", "voyage", "wanderlust"],
  },
  {
    category: "Passions, Hobbies & Joy",
    keywords: ["passion", "hobby", "joy", "interest", "leisure", "fun", "enjoyment", "love doing", "favorite activity"],
  },
  {
    category: "Values, Beliefs & Reflections",
    keywords: ["values", "beliefs", "reflection", "philosophy", "principles", "morals", "ethics", "thinking", "perspective"],
  },
  {
    category: "Parenthood & Family of Choice",
    keywords: ["parent", "parenting", "children", "kids", "raising", "family of choice", "adoption", "stepfamily"],
  },
  {
    category: "Dreams, Future & Aspirations",
    keywords: ["dream", "future", "aspiration", "hope", "goal", "ambition", "wish", "vision", "tomorrow"],
  },
  {
    category: "Life Lessons & Wisdom",
    keywords: ["lesson", "wisdom", "learn", "experience", "advice", "insight", "knowledge", "understanding"],
  },
  {
    category: "Health, Body & Wellbeing",
    keywords: ["health", "body", "wellbeing", "fitness", "medical", "illness", "wellness", "physical", "mental health"],
  },
  {
    category: "Identity, Culture & Belonging",
    keywords: ["identity", "culture", "heritage", "belonging", "roots", "traditions", "ethnicity", "cultural", "origin"],
  },
  {
    category: "Money, Home & Lifestyle",
    keywords: ["money", "financial", "home", "lifestyle", "house", "property", "wealth", "income", "living"],
  },
  {
    category: "Migration & New Beginnings",
    keywords: ["migration", "immigrant", "move", "relocate", "new beginning", "fresh start", "change", "transition"],
  },
  {
    category: "Entrepreneurship & Ambition",
    keywords: ["entrepreneur", "business", "startup", "company", "venture", "ambition", "self-employed", "founder"],
  },
  {
    category: "Faith, Philosophy & Meaning",
    keywords: ["faith", "religion", "spiritual", "philosophy", "meaning", "belief", "god", "purpose", "existential"],
  },
  {
    category: "Military, Service & Duty",
    keywords: ["military", "service", "duty", "soldier", "army", "navy", "veteran", "deployment", "combat"],
  },
  {
    category: "Technology, Modern Life & Social Media",
    keywords: ["technology", "tech", "digital", "social media", "internet", "online", "modern", "smartphone", "computer"],
  },
];

export function matchCategoryFromText(text: string): QuestionCategory | null {
  const lowerText = text.toLowerCase();
  
  let bestMatch: { category: QuestionCategory; score: number } | null = null;
  
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    let score = 0;
    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { category, score };
    }
  }
  
  return bestMatch?.category || null;
}
