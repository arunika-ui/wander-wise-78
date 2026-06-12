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
      activities: {
        Row: {
          created_at: string
          day_id: string
          description: string | null
          id: string
          image_keywords: string | null
          location: string | null
          order_index: number
          time: string | null
          title: string
        }
        Insert: {
          created_at?: string
          day_id: string
          description?: string | null
          id?: string
          image_keywords?: string | null
          location?: string | null
          order_index?: number
          time?: string | null
          title: string
        }
        Update: {
          created_at?: string
          day_id?: string
          description?: string | null
          id?: string
          image_keywords?: string | null
          location?: string | null
          order_index?: number
          time?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_day_id_fkey"
            columns: ["day_id"]
            isOneToOne: false
            referencedRelation: "itinerary_days"
            referencedColumns: ["id"]
          },
        ]
      }
      cities_ref: {
        Row: {
          country_code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          country_code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          country_code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_ref_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries_ref"
            referencedColumns: ["code"]
          },
        ]
      }
      countries_ref: {
        Row: {
          code: string
          created_at: string
          currency: string | null
          dial_code: string | null
          flag_emoji: string | null
          languages: string[] | null
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string | null
          dial_code?: string | null
          flag_emoji?: string | null
          languages?: string[] | null
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string | null
          dial_code?: string | null
          flag_emoji?: string | null
          languages?: string[] | null
          name?: string
        }
        Relationships: []
      }
      emergency_ref: {
        Row: {
          address: string | null
          contact_type: string
          country_code: string
          created_at: string
          id: string
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          contact_type: string
          country_code: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          contact_type?: string
          country_code?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_ref_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries_ref"
            referencedColumns: ["code"]
          },
        ]
      }
      itinerary_days: {
        Row: {
          created_at: string
          date: string | null
          day_number: number
          id: string
          leg_id: string
          title: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          day_number: number
          id?: string
          leg_id: string
          title?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          day_number?: number
          id?: string
          leg_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "itinerary_days_leg_id_fkey"
            columns: ["leg_id"]
            isOneToOne: false
            referencedRelation: "trip_legs"
            referencedColumns: ["id"]
          },
        ]
      }
      language_phrases_ref: {
        Row: {
          category: string | null
          country_code: string
          created_at: string
          english: string
          id: string
          language: string
          translation: string | null
        }
        Insert: {
          category?: string | null
          country_code: string
          created_at?: string
          english: string
          id?: string
          language: string
          translation?: string | null
        }
        Update: {
          category?: string | null
          country_code?: string
          created_at?: string
          english?: string
          id?: string
          language?: string
          translation?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "language_phrases_ref_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries_ref"
            referencedColumns: ["code"]
          },
        ]
      }
      laws_ref: {
        Row: {
          category: string | null
          country_code: string
          created_at: string
          description: string
          id: string
          title: string
        }
        Insert: {
          category?: string | null
          country_code: string
          created_at?: string
          description: string
          id?: string
          title: string
        }
        Update: {
          category?: string | null
          country_code?: string
          created_at?: string
          description?: string
          id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "laws_ref_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries_ref"
            referencedColumns: ["code"]
          },
        ]
      }
      local_apps_ref: {
        Row: {
          android_url: string | null
          app_name: string
          category: string | null
          country_code: string
          created_at: string
          description: string | null
          id: string
          ios_url: string | null
        }
        Insert: {
          android_url?: string | null
          app_name: string
          category?: string | null
          country_code: string
          created_at?: string
          description?: string | null
          id?: string
          ios_url?: string | null
        }
        Update: {
          android_url?: string | null
          app_name?: string
          category?: string | null
          country_code?: string
          created_at?: string
          description?: string | null
          id?: string
          ios_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_apps_ref_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries_ref"
            referencedColumns: ["code"]
          },
        ]
      }
      trip_documents: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          id: string
          mime_type: string | null
          size_bytes: number | null
          trip_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          trip_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          mime_type?: string | null
          size_bytes?: number | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_legs: {
        Row: {
          city_name: string
          country_code: string
          created_at: string
          end_date: string | null
          id: string
          order_index: number
          start_date: string | null
          trip_id: string
        }
        Insert: {
          city_name: string
          country_code: string
          created_at?: string
          end_date?: string | null
          id?: string
          order_index?: number
          start_date?: string | null
          trip_id: string
        }
        Update: {
          city_name?: string
          country_code?: string
          created_at?: string
          end_date?: string | null
          id?: string
          order_index?: number
          start_date?: string | null
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_legs_country_code_fkey"
            columns: ["country_code"]
            isOneToOne: false
            referencedRelation: "countries_ref"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "trip_legs_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          client_name: string
          created_at: string
          created_by: string | null
          expiry_date: string
          id: string
          slug: string
          tagline: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          client_name: string
          created_at?: string
          created_by?: string | null
          expiry_date: string
          id?: string
          slug: string
          tagline?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          client_name?: string
          created_at?: string
          created_by?: string | null
          expiry_date?: string
          id?: string
          slug?: string
          tagline?: string | null
          title?: string | null
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
