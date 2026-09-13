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
      admin_courses: {
        Row: {
          category: string | null
          class_name: string | null
          created_at: string
          description: string | null
          enabled: boolean
          exam: string | null
          id: string
          source_url: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          class_name?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          exam?: string | null
          id?: string
          source_url?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          class_name?: string | null
          created_at?: string
          description?: string | null
          enabled?: boolean
          exam?: string | null
          id?: string
          source_url?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_lectures: {
        Row: {
          chapter: string
          course_id: string
          created_at: string
          enabled: boolean
          id: string
          notes_url: string | null
          order_index: number
          subject: string
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          chapter?: string
          course_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          notes_url?: string | null
          order_index?: number
          subject?: string
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          chapter?: string
          course_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          notes_url?: string | null
          order_index?: number
          subject?: string
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_lectures_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notes: {
        Row: {
          course_id: string
          created_at: string
          enabled: boolean
          id: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          course_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          course_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "admin_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      course_overrides: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          hidden: boolean
          thumbnail_url: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          hidden?: boolean
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          hidden?: boolean
          thumbnail_url?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: string
          course_title: string
          created_at: string
          exam: string | null
          id: string
          last_chapter_id: string | null
          last_lesson_id: string | null
          last_lesson_title: string | null
          last_subject_id: string | null
          last_watched_at: string | null
          thumbnail_url: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          course_title: string
          created_at?: string
          exam?: string | null
          id?: string
          last_chapter_id?: string | null
          last_lesson_id?: string | null
          last_lesson_title?: string | null
          last_subject_id?: string | null
          last_watched_at?: string | null
          thumbnail_url?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          course_title?: string
          created_at?: string
          exam?: string | null
          id?: string
          last_chapter_id?: string | null
          last_lesson_id?: string | null
          last_lesson_title?: string | null
          last_subject_id?: string | null
          last_watched_at?: string | null
          thumbnail_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          chapter_id: string | null
          completed: boolean
          completed_at: string | null
          course_id: string
          duration_seconds: number | null
          id: string
          lesson_id: string
          lesson_title: string | null
          position_seconds: number
          seconds_watched: number
          subject_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          chapter_id?: string | null
          completed?: boolean
          completed_at?: string | null
          course_id: string
          duration_seconds?: number | null
          id?: string
          lesson_id: string
          lesson_title?: string | null
          position_seconds?: number
          seconds_watched?: number
          subject_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          chapter_id?: string | null
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          duration_seconds?: number | null
          id?: string
          lesson_id?: string
          lesson_title?: string | null
          position_seconds?: number
          seconds_watched?: number
          subject_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          disabled: boolean
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          disabled?: boolean
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          disabled?: boolean
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      app_role: "admin" | "student"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "student"],
    },
  },
} as const
