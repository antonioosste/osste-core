export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      chapters: {
        Row: {
          created_at: string | null
          id: string
          image_hints: Json | null
          order_index: number | null
          overall_summary: string | null
          quotes: Json | null
          recording_id: string | null
          session_id: string | null
          suggested_cover_title: string | null
          summary: string | null
          title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_hints?: Json | null
          order_index?: number | null
          overall_summary?: string | null
          quotes?: Json | null
          recording_id?: string | null
          session_id?: string | null
          suggested_cover_title?: string | null
          summary?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_hints?: Json | null
          order_index?: number | null
          overall_summary?: string | null
          quotes?: Json | null
          recording_id?: string | null
          session_id?: string | null
          suggested_cover_title?: string | null
          summary?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapters_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      followup_templates: {
        Row: {
          created_at: string | null
          id: number
          prompt: string
          type: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          prompt: string
          type: string
        }
        Update: {
          created_at?: string | null
          id?: number
          prompt?: string
          type?: string
        }
        Relationships: []
      }
      pages: {
        Row: {
          body_markdown: string | null
          created_at: string
          id: string
          is_published: boolean | null
          published_at: string | null
          seo_description: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body_markdown?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body_markdown?: string | null
          created_at?: string
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          seo_description?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          name: string | null
          plan: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id: string
          name?: string | null
          plan?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          name?: string | null
          plan?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prompts: {
        Row: {
          created_at: string | null
          id: string
          text: string
          topic_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          text: string
          topic_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          text?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prompts_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          category: string
          created_at: string | null
          depth_level: number | null
          emotion_tags: string | null
          followup_type: string | null
          id: number
          locale_variant: string | null
          question: string
        }
        Insert: {
          category: string
          created_at?: string | null
          depth_level?: number | null
          emotion_tags?: string | null
          followup_type?: string | null
          id?: number
          locale_variant?: string | null
          question: string
        }
        Update: {
          category?: string
          created_at?: string | null
          depth_level?: number | null
          emotion_tags?: string | null
          followup_type?: string | null
          id?: number
          locale_variant?: string | null
          question?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          id: string
          language: string | null
          mime_type: string | null
          processed_at: string | null
          session_id: string | null
          status: string | null
          storage_path: string
          transcribed_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          language?: string | null
          mime_type?: string | null
          processed_at?: string | null
          session_id?: string | null
          status?: string | null
          storage_path: string
          transcribed_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          language?: string | null
          mime_type?: string | null
          processed_at?: string | null
          session_id?: string | null
          status?: string | null
          storage_path?: string
          transcribed_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_media: {
        Row: {
          chapter_id: string | null
          created_at: string
          file_name: string
          id: string
          mime_type: string
          prompt: string | null
          session_id: string
          size_bytes: number
          url: string
          user_id: string | null
        }
        Insert: {
          chapter_id?: string | null
          created_at?: string
          file_name: string
          id?: string
          mime_type: string
          prompt?: string | null
          session_id: string
          size_bytes: number
          url: string
          user_id?: string | null
        }
        Update: {
          chapter_id?: string | null
          created_at?: string
          file_name?: string
          id?: string
          mime_type?: string
          prompt?: string | null
          session_id?: string
          size_bytes?: number
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          ended_at: string | null
          id: string
          language: string | null
          last_activity_at: string | null
          mode: string | null
          persona: string | null
          started_at: string | null
          status: string | null
          summary: string | null
          themes: string[] | null
          title: string | null
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          language?: string | null
          last_activity_at?: string | null
          mode?: string | null
          persona?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          themes?: string[] | null
          title?: string | null
          user_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          language?: string | null
          last_activity_at?: string | null
          mode?: string | null
          persona?: string | null
          started_at?: string | null
          status?: string | null
          summary?: string | null
          themes?: string[] | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          approved: boolean | null
          created_at: string | null
          edited_text: string | null
          id: string
          order_index: number | null
          raw_text: string | null
          recording_id: string | null
          session_id: string | null
          title: string | null
        }
        Insert: {
          approved?: boolean | null
          created_at?: string | null
          edited_text?: string | null
          id?: string
          order_index?: number | null
          raw_text?: string | null
          recording_id?: string | null
          session_id?: string | null
          title?: string | null
        }
        Update: {
          approved?: boolean | null
          created_at?: string | null
          edited_text?: string | null
          id?: string
          order_index?: number | null
          raw_text?: string | null
          recording_id?: string | null
          session_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stories_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stories_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      story_embeddings: {
        Row: {
          created_at: string | null
          embedding: string | null
          id: string
          story_id: string | null
        }
        Insert: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          story_id?: string | null
        }
        Update: {
          created_at?: string | null
          embedding?: string | null
          id?: string
          story_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_embeddings_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          created_at: string | null
          id: string
          language: string | null
          model_used: string | null
          recording_id: string
          text: string | null
          word_count: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          language?: string | null
          model_used?: string | null
          recording_id: string
          text?: string | null
          word_count?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          language?: string | null
          model_used?: string | null
          recording_id?: string
          text?: string | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "transcripts_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
        ]
      }
      turns: {
        Row: {
          answer_text: string | null
          created_at: string | null
          entities: Json | null
          follow_up_needed: boolean | null
          follow_up_suggestions: Json | null
          id: string
          images: Json | null
          prompt_text: string | null
          recording_id: string | null
          sentiment: string | null
          session_id: string | null
          status: string | null
          stt_text: string | null
          tts_audio_path: string | null
          tts_voice: string | null
          turn_index: number | null
        }
        Insert: {
          answer_text?: string | null
          created_at?: string | null
          entities?: Json | null
          follow_up_needed?: boolean | null
          follow_up_suggestions?: Json | null
          id?: string
          images?: Json | null
          prompt_text?: string | null
          recording_id?: string | null
          sentiment?: string | null
          session_id?: string | null
          status?: string | null
          stt_text?: string | null
          tts_audio_path?: string | null
          tts_voice?: string | null
          turn_index?: number | null
        }
        Update: {
          answer_text?: string | null
          created_at?: string | null
          entities?: Json | null
          follow_up_needed?: boolean | null
          follow_up_suggestions?: Json | null
          id?: string
          images?: Json | null
          prompt_text?: string | null
          recording_id?: string | null
          sentiment?: string | null
          session_id?: string | null
          status?: string | null
          stt_text?: string | null
          tts_audio_path?: string | null
          tts_voice?: string | null
          turn_index?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "turns_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      waitlist_signups: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          referral_source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          referral_source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          referral_source?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      recording_status: "uploaded" | "transcribed" | "processed" | "failed"
      user_role_type: "user" | "admin" | "editor"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      recording_status: ["uploaded", "transcribed", "processed", "failed"],
      user_role_type: ["user", "admin", "editor"],
    },
  },
} as const
