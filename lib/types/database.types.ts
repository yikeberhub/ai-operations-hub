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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          confidence: number | null
          content: string
          created_at: string
          id: string
          org_id: string
          role: string
          session_id: string
          sources: Json
        }
        Insert: {
          confidence?: number | null
          content: string
          created_at?: string
          id?: string
          org_id: string
          role: string
          session_id: string
          sources?: Json
        }
        Update: {
          confidence?: number | null
          content?: string
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          session_id?: string
          sources?: Json
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string
          escalated: boolean
          id: string
          org_id: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          escalated?: boolean
          id?: string
          org_id: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          escalated?: boolean
          id?: string
          org_id?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      document_chunks: {
        Row: {
          content: string
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json
          org_id: string
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json
          org_id: string
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_chunks_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          error: string | null
          id: string
          org_id: string
          status: Database["public"]["Enums"]["document_status"]
          storage_path: string
          title: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          org_id: string
          status?: Database["public"]["Enums"]["document_status"]
          storage_path: string
          title: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          org_id?: string
          status?: Database["public"]["Enums"]["document_status"]
          storage_path?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      emails: {
        Row: {
          ai_summary: string | null
          body: string
          category: Database["public"]["Enums"]["email_category"] | null
          created_at: string
          draft_reply: string | null
          from_address: string
          id: string
          org_id: string
          priority: Database["public"]["Enums"]["email_priority"] | null
          sentiment: Database["public"]["Enums"]["email_sentiment"] | null
          sentiment_score: number | null
          status: Database["public"]["Enums"]["email_status"]
          subject: string | null
          thread_id: string | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          body: string
          category?: Database["public"]["Enums"]["email_category"] | null
          created_at?: string
          draft_reply?: string | null
          from_address: string
          id?: string
          org_id: string
          priority?: Database["public"]["Enums"]["email_priority"] | null
          sentiment?: Database["public"]["Enums"]["email_sentiment"] | null
          sentiment_score?: number | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          body?: string
          category?: Database["public"]["Enums"]["email_category"] | null
          created_at?: string
          draft_reply?: string | null
          from_address?: string
          id?: string
          org_id?: string
          priority?: Database["public"]["Enums"]["email_priority"] | null
          sentiment?: Database["public"]["Enums"]["email_sentiment"] | null
          sentiment_score?: number | null
          status?: Database["public"]["Enums"]["email_status"]
          subject?: string | null
          thread_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "emails_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          ai_summary: string | null
          client_id: string | null
          company: string | null
          created_at: string
          draft_email: string | null
          email: string
          full_name: string
          id: string
          message: string | null
          next_action: string | null
          org_id: string
          phone: string | null
          priority: Database["public"]["Enums"]["lead_priority"] | null
          score: number | null
          sentiment: Database["public"]["Enums"]["lead_sentiment"] | null
          sentiment_score: number | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          client_id?: string | null
          company?: string | null
          created_at?: string
          draft_email?: string | null
          email: string
          full_name: string
          id?: string
          message?: string | null
          next_action?: string | null
          org_id: string
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          score?: number | null
          sentiment?: Database["public"]["Enums"]["lead_sentiment"] | null
          sentiment_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          client_id?: string | null
          company?: string | null
          created_at?: string
          draft_email?: string | null
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          next_action?: string | null
          org_id?: string
          phone?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"] | null
          score?: number | null
          sentiment?: Database["public"]["Enums"]["lead_sentiment"] | null
          sentiment_score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      orgs: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_logs: {
        Row: {
          created_at: string
          duration_ms: number | null
          error_details: Json | null
          id: string
          org_id: string
          payload: Json | null
          source: Database["public"]["Enums"]["workflow_source"]
          status: Database["public"]["Enums"]["workflow_status"]
          workflow_name: string
        }
        Insert: {
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          org_id: string
          payload?: Json | null
          source?: Database["public"]["Enums"]["workflow_source"]
          status: Database["public"]["Enums"]["workflow_status"]
          workflow_name: string
        }
        Update: {
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          id?: string
          org_id?: string
          payload?: Json | null
          source?: Database["public"]["Enums"]["workflow_source"]
          status?: Database["public"]["Enums"]["workflow_status"]
          workflow_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_logs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "orgs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      current_org_id: { Args: never; Returns: string }
      email_priority_vs_sentiment: {
        Args: { p_org_id: string }
        Returns: { priority: string; sentiment: string; count: number }[]
      }
      email_sentiment_counts: {
        Args: { p_org_id: string }
        Returns: { sentiment: string; count: number }[]
      }
      email_sentiment_trend_30d: {
        Args: { p_org_id: string }
        Returns: { day: string; avg_sentiment_score: number }[]
      }
      is_staff: { Args: never; Returns: boolean }
      match_document_chunks: {
        Args: {
          match_count?: number
          match_org_id: string
          query_embedding: string
          similarity_threshold?: number
        }
        Returns: {
          content: string
          document_id: string
          id: string
          metadata: Json
          similarity: number
        }[]
      }
    }
    Enums: {
      document_status: "processing" | "ready" | "failed"
      email_category: "sales" | "support" | "billing" | "spam" | "other"
      email_priority: "HOT" | "WARM" | "COLD"
      email_sentiment: "Positive" | "Neutral" | "Negative"
      email_status: "new" | "processing" | "processed" | "replied"
      lead_priority: "HOT" | "WARM" | "COLD"
      lead_sentiment: "Positive" | "Neutral" | "Negative"
      lead_status: "new" | "processing" | "qualified" | "contacted" | "closed"
      user_role: "admin" | "agent" | "client"
      workflow_source: "app" | "n8n"
      workflow_status: "success" | "failure"
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
      document_status: ["processing", "ready", "failed"],
      email_category: ["sales", "support", "billing", "spam", "other"],
      email_priority: ["HOT", "WARM", "COLD"],
      email_sentiment: ["Positive", "Neutral", "Negative"],
      email_status: ["new", "processing", "processed", "replied"],
      lead_priority: ["HOT", "WARM", "COLD"],
      lead_sentiment: ["Positive", "Neutral", "Negative"],
      lead_status: ["new", "processing", "qualified", "contacted", "closed"],
      user_role: ["admin", "agent", "client"],
      workflow_source: ["app", "n8n"],
      workflow_status: ["success", "failure"],
    },
  },
} as const
