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
          created_at: string | null
          id: string
          name: string | null
          plan: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          name?: string | null
          plan?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          plan?: string | null
        }
        Relationships: []
      }
      sessions: {
        Row: {
          ended_at: string | null
          id: string
          language: string | null
          persona: string | null
          started_at: string | null
          status: string | null
          themes: string[] | null
          user_id: string
        }
        Insert: {
          ended_at?: string | null
          id?: string
          language?: string | null
          persona?: string | null
          started_at?: string | null
          status?: string | null
          themes?: string[] | null
          user_id: string
        }
        Update: {
          ended_at?: string | null
          id?: string
          language?: string | null
          persona?: string | null
          started_at?: string | null
          status?: string | null
          themes?: string[] | null
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
          session_id?: string | null
          title?: string | null
        }
        Relationships: [
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
          embedding: string | null
          story_id: string | null
        }
        Insert: {
          embedding?: string | null
          story_id?: string | null
        }
        Update: {
          embedding?: string | null
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
      turns: {
        Row: {
          created_at: string | null
          entities: Json | null
          id: string
          sentiment: string | null
          session_id: string | null
          stt_text: string | null
          tts_voice: string | null
          turn_index: number | null
        }
        Insert: {
          created_at?: string | null
          entities?: Json | null
          id?: string
          sentiment?: string | null
          session_id?: string | null
          stt_text?: string | null
          tts_voice?: string | null
          turn_index?: number | null
        }
        Update: {
          created_at?: string | null
          entities?: Json | null
          id?: string
          sentiment?: string | null
          session_id?: string | null
          stt_text?: string | null
          tts_voice?: string | null
          turn_index?: number | null
        }
        Relationships: [
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
    },
  },
} as const
