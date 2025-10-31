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
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          company: string
          country: string
          created_at: string | null
          created_from_ip: string | null
          email: string
          id: string
          is_active: boolean | null
          is_public: boolean | null
          key: string
          last_rotated_at: string | null
          last_used_at: string | null
          plan: string
          project_id: string | null
          rpm: number
          scopes: Database["public"]["Enums"]["api_scope"][] | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          company: string
          country: string
          created_at?: string | null
          created_from_ip?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          key: string
          last_rotated_at?: string | null
          last_used_at?: string | null
          plan?: string
          project_id?: string | null
          rpm?: number
          scopes?: Database["public"]["Enums"]["api_scope"][] | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          company?: string
          country?: string
          created_at?: string | null
          created_from_ip?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_public?: boolean | null
          key?: string
          last_rotated_at?: string | null
          last_used_at?: string | null
          plan?: string
          project_id?: string | null
          rpm?: number
          scopes?: Database["public"]["Enums"]["api_scope"][] | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key: string
          created_at: string
          endpoint: string
          id: string
          metadata: Json | null
        }
        Insert: {
          api_key: string
          created_at?: string
          endpoint: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          api_key?: string
          created_at?: string
          endpoint?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          bounced_at: string | null
          campaign_type: string
          clicked_at: string | null
          conversion_value: number | null
          created_at: string | null
          email_body: string
          email_subject: string
          error_message: string | null
          heygen_video_id: string | null
          id: string
          lead_id: string | null
          metadata: Json | null
          opened_at: string | null
          replied_at: string | null
          sendgrid_message_id: string | null
          sent_at: string | null
          status: string | null
          unsubscribed_at: string | null
          updated_at: string | null
          video_script: string | null
          video_status: string | null
          video_url: string | null
        }
        Insert: {
          bounced_at?: string | null
          campaign_type: string
          clicked_at?: string | null
          conversion_value?: number | null
          created_at?: string | null
          email_body: string
          email_subject: string
          error_message?: string | null
          heygen_video_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          replied_at?: string | null
          sendgrid_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          video_script?: string | null
          video_status?: string | null
          video_url?: string | null
        }
        Update: {
          bounced_at?: string | null
          campaign_type?: string
          clicked_at?: string | null
          conversion_value?: number | null
          created_at?: string | null
          email_body?: string
          email_subject?: string
          error_message?: string | null
          heygen_video_id?: string | null
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          opened_at?: string | null
          replied_at?: string | null
          sendgrid_message_id?: string | null
          sent_at?: string | null
          status?: string | null
          unsubscribed_at?: string | null
          updated_at?: string | null
          video_script?: string | null
          video_status?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      failed_transactions: {
        Row: {
          client_ip: string | null
          created_at: string | null
          endpoint: string
          error_message: string | null
          error_type: string
          id: string
          request_payload: Json | null
          user_agent: string | null
        }
        Insert: {
          client_ip?: string | null
          created_at?: string | null
          endpoint: string
          error_message?: string | null
          error_type: string
          id?: string
          request_payload?: Json | null
          user_agent?: string | null
        }
        Update: {
          client_ip?: string | null
          created_at?: string | null
          endpoint?: string
          error_message?: string | null
          error_type?: string
          id?: string
          request_payload?: Json | null
          user_agent?: string | null
        }
        Relationships: []
      }
      ip_rate_limits: {
        Row: {
          count: number
          created_at: string | null
          endpoint: string
          id: string
          ip: string
          window_start: string
        }
        Insert: {
          count?: number
          created_at?: string | null
          endpoint: string
          id?: string
          ip: string
          window_start?: string
        }
        Update: {
          count?: number
          created_at?: string | null
          endpoint?: string
          id?: string
          ip?: string
          window_start?: string
        }
        Relationships: []
      }
      ipayx_fees: {
        Row: {
          amount_usd: number
          chain: string
          client_address: string
          created_at: string
          explorer_url: string
          fee_usd: number
          id: string
          settlement_asset: string
          status: string
          tx_hash: string
        }
        Insert: {
          amount_usd: number
          chain: string
          client_address: string
          created_at?: string
          explorer_url: string
          fee_usd: number
          id?: string
          settlement_asset: string
          status?: string
          tx_hash: string
        }
        Update: {
          amount_usd?: number
          chain?: string
          client_address?: string
          created_at?: string
          explorer_url?: string
          fee_usd?: number
          id?: string
          settlement_asset?: string
          status?: string
          tx_hash?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          ai_analysis: Json | null
          ai_score: number | null
          campaigns_count: number | null
          company: string | null
          country: string | null
          created_at: string | null
          email: string
          id: string
          last_campaign_sent_at: string | null
          last_clicked_at: string | null
          last_opened_at: string | null
          message: string | null
          metadata: Json | null
          monthly_volume: string | null
          name: string | null
          source: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_score?: number | null
          campaigns_count?: number | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          id?: string
          last_campaign_sent_at?: string | null
          last_clicked_at?: string | null
          last_opened_at?: string | null
          message?: string | null
          metadata?: Json | null
          monthly_volume?: string | null
          name?: string | null
          source?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_score?: number | null
          campaigns_count?: number | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          last_campaign_sent_at?: string | null
          last_clicked_at?: string | null
          last_opened_at?: string | null
          message?: string | null
          metadata?: Json | null
          monthly_volume?: string | null
          name?: string | null
          source?: string | null
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          email_verified: boolean | null
          id: string
          name: string
          owner_id: string
          updated_at: string
          verification_sent_at: string | null
          verification_token: string | null
        }
        Insert: {
          created_at?: string
          email_verified?: boolean | null
          id?: string
          name: string
          owner_id: string
          updated_at?: string
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Update: {
          created_at?: string
          email_verified?: boolean | null
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      partner_integrations: {
        Row: {
          api_endpoint: string
          created_at: string
          id: string
          is_active: boolean
          partner_type: Database["public"]["Enums"]["partner_type"]
          supported_chains: string[]
          webhook_secret: string | null
        }
        Insert: {
          api_endpoint: string
          created_at?: string
          id?: string
          is_active?: boolean
          partner_type: Database["public"]["Enums"]["partner_type"]
          supported_chains: string[]
          webhook_secret?: string | null
        }
        Update: {
          api_endpoint?: string
          created_at?: string
          id?: string
          is_active?: boolean
          partner_type?: Database["public"]["Enums"]["partner_type"]
          supported_chains?: string[]
          webhook_secret?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          backup_codes: string[] | null
          company: string | null
          country: string | null
          created_at: string | null
          email: string
          id: string
          kyc_status: string | null
          partner_id: string | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string | null
        }
        Insert: {
          backup_codes?: string[] | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email: string
          id: string
          kyc_status?: string | null
          partner_id?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
        }
        Update: {
          backup_codes?: string[] | null
          company?: string | null
          country?: string | null
          created_at?: string | null
          email?: string
          id?: string
          kyc_status?: string | null
          partner_id?: string | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          id: string
          name: string
          org_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          org_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_audits: {
        Row: {
          created_at: string
          critical_count: number | null
          high_count: number | null
          id: string
          low_count: number | null
          medium_count: number | null
          metadata: Json | null
          model: string
          report: Json
          security_score: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          critical_count?: number | null
          high_count?: number | null
          id?: string
          low_count?: number | null
          medium_count?: number | null
          metadata?: Json | null
          model?: string
          report: Json
          security_score?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          critical_count?: number | null
          high_count?: number | null
          id?: string
          low_count?: number | null
          medium_count?: number | null
          metadata?: Json | null
          model?: string
          report?: Json
          security_score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          email: string
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          email: string
          id?: string
          plan: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          metric_type: string
          value: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          value: number
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          value?: number
        }
        Relationships: []
      }
      transaction_logs: {
        Row: {
          amount: number
          asset: string
          created_at: string
          external_id: string | null
          from_chain: string
          id: string
          partner_response: Json | null
          status: string
          to_chain: string
          tx_hash: string | null
          user_account_id: string
          user_id: string
        }
        Insert: {
          amount: number
          asset: string
          created_at?: string
          external_id?: string | null
          from_chain: string
          id?: string
          partner_response?: Json | null
          status: string
          to_chain: string
          tx_hash?: string | null
          user_account_id: string
          user_id: string
        }
        Update: {
          amount?: number
          asset?: string
          created_at?: string
          external_id?: string | null
          from_chain?: string
          id?: string
          partner_response?: Json | null
          status?: string
          to_chain?: string
          tx_hash?: string | null
          user_account_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_logs_user_account_id_fkey"
            columns: ["user_account_id"]
            isOneToOne: false
            referencedRelation: "user_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      user_accounts: {
        Row: {
          company: string
          country: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          deletion_reason: string | null
          email: string
          id: string
          kyc_status: Database["public"]["Enums"]["kyc_status"]
          partner_account_id: string | null
          partner_id: Database["public"]["Enums"]["partner_type"] | null
          partner_kyc_url: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          company: string
          country: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          partner_account_id?: string | null
          partner_id?: Database["public"]["Enums"]["partner_type"] | null
          partner_kyc_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          company?: string
          country?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          deletion_reason?: string | null
          email?: string
          id?: string
          kyc_status?: Database["public"]["Enums"]["kyc_status"]
          partner_account_id?: string | null
          partner_id?: Database["public"]["Enums"]["partner_type"] | null
          partner_kyc_url?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
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
      webhook_events: {
        Row: {
          created_at: string | null
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean | null
          provider: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean | null
          provider: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean | null
          provider?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      has_api_scope: {
        Args: {
          _api_key: string
          _scope: Database["public"]["Enums"]["api_scope"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      soft_delete_user_account: {
        Args: { _account_id: string; _reason: string }
        Returns: boolean
      }
      user_org_access: {
        Args: { _user_id: string }
        Returns: {
          org_id: string
        }[]
      }
    }
    Enums: {
      api_scope:
        | "quotes:read"
        | "routes:read"
        | "payments:write"
        | "webhooks:read"
      app_role: "admin" | "moderator" | "user"
      kyc_status: "pending" | "approved" | "denied" | "under_review"
      partner_type: "circle" | "coinbase" | "personna" | "sumsub"
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
      api_scope: [
        "quotes:read",
        "routes:read",
        "payments:write",
        "webhooks:read",
      ],
      app_role: ["admin", "moderator", "user"],
      kyc_status: ["pending", "approved", "denied", "under_review"],
      partner_type: ["circle", "coinbase", "personna", "sumsub"],
    },
  },
} as const
