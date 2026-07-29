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
      categories: {
        Row: {
          base_price: number | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      customer_addresses: {
        Row: {
          city: string | null
          created_at: string
          id: string
          is_default: boolean
          label: string
          line1: string
          line2: string | null
          postcode: string
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          line1: string
          line2?: string | null
          postcode: string
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          line1?: string
          line2?: string | null
          postcode?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      disputes: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          id: string
          job_id: string
          opened_by: string
          provider_id: string
          reason: string
          resolution: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          job_id: string
          opened_by: string
          provider_id: string
          reason: string
          resolution?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          job_id?: string
          opened_by?: string
          provider_id?: string
          reason?: string
          resolution?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          budget_max: number | null
          budget_min: number | null
          category_id: string | null
          city: string | null
          created_at: string
          customer_id: string
          description: string
          id: string
          images: string[]
          lat: number | null
          lng: number | null
          postcode: string | null
          scheduled_date: string | null
          status: string
          title: string
          updated_at: string
          urgency: string
          videos: string[]
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          customer_id: string
          description: string
          id?: string
          images?: string[]
          lat?: number | null
          lng?: number | null
          postcode?: string | null
          scheduled_date?: string | null
          status?: string
          title: string
          updated_at?: string
          urgency?: string
          videos?: string[]
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          budget_max?: number | null
          budget_min?: number | null
          category_id?: string | null
          city?: string | null
          created_at?: string
          customer_id?: string
          description?: string
          id?: string
          images?: string[]
          lat?: number | null
          lng?: number | null
          postcode?: string | null
          scheduled_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          urgency?: string
          videos?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string | null
          created_at: string
          id: string
          image_url: string | null
          job_id: string
          provider_id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          job_id: string
          provider_id: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          job_id?: string
          provider_id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      payout_holds: {
        Row: {
          active: boolean
          created_at: string
          created_by: string | null
          id: string
          provider_id: string
          reason: string
          released_at: string | null
          released_by: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          provider_id: string
          reason: string
          released_at?: string | null
          released_by?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          provider_id?: string
          reason?: string
          released_at?: string | null
          released_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          estimated_arrival: string | null
          failure_reason: string | null
          id: string
          notes: string | null
          processed_at: string | null
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string
          estimated_arrival?: string | null
          failure_reason?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          estimated_arrival?: string | null
          failure_reason?: string | null
          id?: string
          notes?: string | null
          processed_at?: string | null
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_requests_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "provider_bank_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          areas_covered: string[]
          available_today: boolean
          avatar_url: string | null
          bio: string | null
          business_name: string | null
          business_type: string | null
          company_number: string | null
          created_at: string
          date_of_birth: string | null
          display_name: string | null
          emergency_jobs: boolean
          holiday_dates: Json
          home_address: string | null
          id: string
          is_available: boolean | null
          notification_preferences: Json
          onboarding_status: string
          phone: string | null
          postcode: string | null
          service_radius: number | null
          trading_name: string | null
          type: string
          updated_at: string
          user_id: string
          vat_number: string | null
          vat_registered: boolean
          verification_status: string | null
          working_days: string[]
          working_hours: Json
          years_experience: number | null
        }
        Insert: {
          account_status?: string
          areas_covered?: string[]
          available_today?: boolean
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          company_number?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          emergency_jobs?: boolean
          holiday_dates?: Json
          home_address?: string | null
          id?: string
          is_available?: boolean | null
          notification_preferences?: Json
          onboarding_status?: string
          phone?: string | null
          postcode?: string | null
          service_radius?: number | null
          trading_name?: string | null
          type?: string
          updated_at?: string
          user_id: string
          vat_number?: string | null
          vat_registered?: boolean
          verification_status?: string | null
          working_days?: string[]
          working_hours?: Json
          years_experience?: number | null
        }
        Update: {
          account_status?: string
          areas_covered?: string[]
          available_today?: boolean
          avatar_url?: string | null
          bio?: string | null
          business_name?: string | null
          business_type?: string | null
          company_number?: string | null
          created_at?: string
          date_of_birth?: string | null
          display_name?: string | null
          emergency_jobs?: boolean
          holiday_dates?: Json
          home_address?: string | null
          id?: string
          is_available?: boolean | null
          notification_preferences?: Json
          onboarding_status?: string
          phone?: string | null
          postcode?: string | null
          service_radius?: number | null
          trading_name?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          vat_number?: string | null
          vat_registered?: boolean
          verification_status?: string | null
          working_days?: string[]
          working_hours?: Json
          years_experience?: number | null
        }
        Relationships: []
      }
      provider_bank_accounts: {
        Row: {
          account_holder: string
          account_last4: string
          bank_name: string
          created_at: string
          id: string
          is_default: boolean
          provider_id: string
          sort_code: string
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_last4: string
          bank_name: string
          created_at?: string
          id?: string
          is_default?: boolean
          provider_id: string
          sort_code: string
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_last4?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_default?: boolean
          provider_id?: string
          sort_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_categories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          provider_id: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          provider_id: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_categories_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_stripe_accounts: {
        Row: {
          charges_enabled: boolean
          country: string | null
          created_at: string
          details_submitted: boolean
          id: string
          payouts_enabled: boolean
          provider_id: string
          requirements: Json | null
          stripe_account_id: string
          updated_at: string
        }
        Insert: {
          charges_enabled?: boolean
          country?: string | null
          created_at?: string
          details_submitted?: boolean
          id?: string
          payouts_enabled?: boolean
          provider_id: string
          requirements?: Json | null
          stripe_account_id: string
          updated_at?: string
        }
        Update: {
          charges_enabled?: boolean
          country?: string | null
          created_at?: string
          details_submitted?: boolean
          id?: string
          payouts_enabled?: boolean
          provider_id?: string
          requirements?: Json | null
          stripe_account_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      provider_subcategories: {
        Row: {
          created_at: string
          id: string
          provider_id: string
          subcategory_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          provider_id: string
          subcategory_id: string
        }
        Update: {
          created_at?: string
          id?: string
          provider_id?: string
          subcategory_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_subcategories_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "service_subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_verifications: {
        Row: {
          created_at: string
          document_type: string
          expiry_date: string | null
          id: string
          notes: string | null
          provider_id: string
          rejected_reason: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          document_type: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          provider_id: string
          rejected_reason?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          document_type?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          provider_id?: string
          rejected_reason?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_verifications_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          job_id: string
          message: string | null
          parent_quote_id: string | null
          price: number
          proposed_by: string
          provider_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          job_id: string
          message?: string | null
          parent_quote_id?: string | null
          price: number
          proposed_by?: string
          provider_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          job_id?: string
          message?: string | null
          parent_quote_id?: string | null
          price?: number
          proposed_by?: string
          provider_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          customer_id: string
          id: string
          job_id: string
          provider_id: string
          rating: number
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_id: string
          id?: string
          job_id: string
          provider_id: string
          rating: number
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          job_id?: string
          provider_id?: string
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      service_subcategories: {
        Row: {
          category_id: string
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "service_subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_reply: string | null
          category: string
          created_at: string
          id: string
          message: string
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
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
      wallet_transactions: {
        Row: {
          amount: number
          available_at: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          job_id: string | null
          payout_request_id: string | null
          provider_id: string
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          available_at?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          payout_request_id?: string | null
          provider_id: string
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          available_at?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          job_id?: string | null
          payout_request_id?: string | null
          provider_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_payout_request_id_fkey"
            columns: ["payout_request_id"]
            isOneToOne: false
            referencedRelation: "payout_requests"
            referencedColumns: ["id"]
          },
        ]
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
      app_role:
        | "customer"
        | "provider"
        | "admin"
        | "super_admin"
        | "support"
        | "finance"
        | "verification"
        | "marketing"
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
      app_role: [
        "customer",
        "provider",
        "admin",
        "super_admin",
        "support",
        "finance",
        "verification",
        "marketing",
      ],
    },
  },
} as const
