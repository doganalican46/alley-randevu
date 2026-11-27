export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      appointment_services: {
        Row: {
          appointment_id: string
          business_id: string
          currency_snapshot: string
          duration_minutes_snapshot: number
          id: string
          price_snapshot: number
          service_id: string | null
          service_name_snapshot: string
          sort_order: number
        }
        Insert: {
          appointment_id: string
          business_id: string
          currency_snapshot: string
          duration_minutes_snapshot: number
          id?: string
          price_snapshot: number
          service_id?: string | null
          service_name_snapshot: string
          sort_order?: number
        }
        Update: {
          appointment_id?: string
          business_id?: string
          currency_snapshot?: string
          duration_minutes_snapshot?: number
          id?: string
          price_snapshot?: number
          service_id?: string | null
          service_name_snapshot?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: 'appointment_services_business_id_appointment_id_fkey'
            columns: ['business_id', 'appointment_id']
            isOneToOne: false
            referencedRelation: 'appointments'
            referencedColumns: ['business_id', 'id']
          },
          {
            foreignKeyName: 'appointment_services_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointment_services_business_id_service_id_fkey'
            columns: ['business_id', 'service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['business_id', 'id']
          }
        ]
      }
      appointment_status_history: {
        Row: {
          appointment_id: string
          business_id: string
          change_reason: string | null
          changed_by: string | null
          changes: Json
          created_at: string
          id: number
          new_status: Database['public']['Enums']['appointment_status']
          previous_status: Database['public']['Enums']['appointment_status'] | null
        }
        Insert: {
          appointment_id: string
          business_id: string
          change_reason?: string | null
          changed_by?: string | null
          changes?: Json
          created_at?: string
          id?: never
          new_status: Database['public']['Enums']['appointment_status']
          previous_status?: Database['public']['Enums']['appointment_status'] | null
        }
        Update: {
          appointment_id?: string
          business_id?: string
          change_reason?: string | null
          changed_by?: string | null
          changes?: Json
          created_at?: string
          id?: never
          new_status?: Database['public']['Enums']['appointment_status']
          previous_status?: Database['public']['Enums']['appointment_status'] | null
        }
        Relationships: [
          {
            foreignKeyName: 'appointment_status_history_business_id_appointment_id_fkey'
            columns: ['business_id', 'appointment_id']
            isOneToOne: false
            referencedRelation: 'appointments'
            referencedColumns: ['business_id', 'id']
          },
          {
            foreignKeyName: 'appointment_status_history_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          business_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: number
          metadata: Json
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          business_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: never
          metadata?: Json
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          business_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: never
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: 'audit_logs_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      appointments: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          created_by: string | null
          currency: string
          customer_email_snapshot: string | null
          customer_id: string | null
          customer_name_snapshot: string
          customer_phone_snapshot: string | null
          ends_at: string
          id: string
          internal_notes: string | null
          public_notes: string | null
          staff_id: string | null
          starts_at: string
          status: Database['public']['Enums']['appointment_status']
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email_snapshot?: string | null
          customer_id?: string | null
          customer_name_snapshot: string
          customer_phone_snapshot?: string | null
          ends_at: string
          id?: string
          internal_notes?: string | null
          public_notes?: string | null
          staff_id?: string | null
          starts_at: string
          status?: Database['public']['Enums']['appointment_status']
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          customer_email_snapshot?: string | null
          customer_id?: string | null
          customer_name_snapshot?: string
          customer_phone_snapshot?: string | null
          ends_at?: string
          id?: string
          internal_notes?: string | null
          public_notes?: string | null
          staff_id?: string | null
          starts_at?: string
          status?: Database['public']['Enums']['appointment_status']
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'appointments_business_id_branch_id_fkey'
            columns: ['business_id', 'branch_id']
            isOneToOne: false
            referencedRelation: 'branches'
            referencedColumns: ['business_id', 'id']
          },
          {
            foreignKeyName: 'appointments_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'appointments_business_id_staff_id_fkey'
            columns: ['business_id', 'staff_id']
            isOneToOne: false
            referencedRelation: 'staff_profiles'
            referencedColumns: ['business_id', 'id']
          }
        ]
      }
      branches: {
        Row: {
          address_line: string | null
          business_id: string
          created_at: string
          id: string
          is_active: boolean
          is_primary: boolean
          name: string
          phone: string | null
          slug: string
          timezone: string
          updated_at: string
        }
        Insert: {
          address_line?: string | null
          business_id: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name: string
          phone?: string | null
          slug: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          address_line?: string | null
          business_id?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name?: string
          phone?: string | null
          slug?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'branches_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      business_customers: {
        Row: {
          appointment_count: number
          auth_user_id: string | null
          business_id: string
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          last_appointment_at: string | null
          marketing_consent: boolean
          notes: string | null
          phone: string | null
          tags: string[]
          updated_at: string
        }
        Insert: {
          appointment_count?: number
          auth_user_id?: string | null
          business_id: string
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          last_appointment_at?: string | null
          marketing_consent?: boolean
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Update: {
          appointment_count?: number
          auth_user_id?: string | null
          business_id?: string
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          last_appointment_at?: string | null
          marketing_consent?: boolean
          notes?: string | null
          phone?: string | null
          tags?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_customers_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      business_feature_flags: {
        Row: {
          business_id: string
          enabled: boolean
          feature_flag_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_id: string
          enabled?: boolean
          feature_flag_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_id?: string
          enabled?: boolean
          feature_flag_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'business_feature_flags_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'business_feature_flags_feature_flag_id_fkey'
            columns: ['feature_flag_id']
            isOneToOne: false
            referencedRelation: 'feature_flags'
            referencedColumns: ['id']
          }
        ]
      }
      business_members: {
        Row: {
          business_id: string
          is_active: boolean
          joined_at: string
          permissions: string[]
          role: Database['public']['Enums']['business_role']
          user_id: string
        }
        Insert: {
          business_id: string
          is_active?: boolean
          joined_at?: string
          permissions?: string[]
          role: Database['public']['Enums']['business_role']
          user_id: string
        }
        Update: {
          business_id?: string
          is_active?: boolean
          joined_at?: string
          permissions?: string[]
          role?: Database['public']['Enums']['business_role']
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'business_members_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      businesses: {
        Row: {
          auto_confirm_appointments: boolean
          booking_interval_minutes: number
          cancellation_notice_hours: number
          created_at: string
          created_by: string
          currency: string
          description: string | null
          id: string
          is_published: boolean
          maximum_booking_days: number
          minimum_booking_notice_minutes: number
          name: string
          slug: string
          status: Database['public']['Enums']['business_status']
          timezone: string
          updated_at: string
        }
        Insert: {
          auto_confirm_appointments?: boolean
          booking_interval_minutes?: number
          cancellation_notice_hours?: number
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          id?: string
          is_published?: boolean
          maximum_booking_days?: number
          minimum_booking_notice_minutes?: number
          name: string
          slug: string
          status?: Database['public']['Enums']['business_status']
          timezone?: string
          updated_at?: string
        }
        Update: {
          auto_confirm_appointments?: boolean
          booking_interval_minutes?: number
          cancellation_notice_hours?: number
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          id?: string
          is_published?: boolean
          maximum_booking_days?: number
          minimum_booking_notice_minutes?: number
          name?: string
          slug?: string
          status?: Database['public']['Enums']['business_status']
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_subscriptions: {
        Row: {
          business_id: string
          created_at: string
          current_period_ends_at: string | null
          plan_id: string
          status: Database['public']['Enums']['subscription_status']
          trial_ends_at: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          current_period_ends_at?: string | null
          plan_id: string
          status?: Database['public']['Enums']['subscription_status']
          trial_ends_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          current_period_ends_at?: string | null
          plan_id?: string
          status?: Database['public']['Enums']['subscription_status']
          trial_ends_at?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'business_subscriptions_business_id_fkey'
            columns: ['business_id']
            isOneToOne: true
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'business_subscriptions_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'subscription_plans'
            referencedColumns: ['id']
          }
        ]
      }
      campaigns: {
        Row: {
          audience_tag: string | null
          body: string
          business_id: string
          channel: Database['public']['Enums']['notification_channel']
          created_at: string
          created_by: string
          id: string
          name: string
          queued_at: string | null
          recipient_count: number
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          audience_tag?: string | null
          body: string
          business_id: string
          channel: Database['public']['Enums']['notification_channel']
          created_at?: string
          created_by: string
          id?: string
          name: string
          queued_at?: string | null
          recipient_count?: number
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          audience_tag?: string | null
          body?: string
          business_id?: string
          channel?: Database['public']['Enums']['notification_channel']
          created_at?: string
          created_by?: string
          id?: string
          name?: string
          queued_at?: string | null
          recipient_count?: number
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'campaigns_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      customer_loyalty_accounts: {
        Row: {
          business_id: string
          created_at: string
          customer_id: string
          id: string
          lifetime_earned: number
          points_balance: number
          updated_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
          lifetime_earned?: number
          points_balance?: number
          updated_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
          lifetime_earned?: number
          points_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_loyalty_accounts_business_id_customer_id_fkey'
            columns: ['business_id', 'customer_id']
            isOneToOne: true
            referencedRelation: 'business_customers'
            referencedColumns: ['business_id', 'id']
          },
          {
            foreignKeyName: 'customer_loyalty_accounts_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      customer_loyalty_transactions: {
        Row: {
          balance_after: number
          business_id: string
          created_at: string
          created_by: string
          customer_id: string
          id: string
          points_delta: number
          reason: string
        }
        Insert: {
          balance_after: number
          business_id: string
          created_at?: string
          created_by: string
          customer_id: string
          id?: string
          points_delta: number
          reason: string
        }
        Update: {
          balance_after?: number
          business_id?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          points_delta?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_loyalty_transactions_business_id_customer_id_fkey'
            columns: ['business_id', 'customer_id']
            isOneToOne: false
            referencedRelation: 'business_customers'
            referencedColumns: ['business_id', 'id']
          },
          {
            foreignKeyName: 'customer_loyalty_transactions_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      customer_notes: {
        Row: {
          author_user_id: string
          body: string
          business_id: string
          created_at: string
          customer_id: string
          id: string
        }
        Insert: {
          author_user_id: string
          body: string
          business_id: string
          created_at?: string
          customer_id: string
          id?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          business_id?: string
          created_at?: string
          customer_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'customer_notes_business_id_customer_id_fkey'
            columns: ['business_id', 'customer_id']
            isOneToOne: false
            referencedRelation: 'business_customers'
            referencedColumns: ['business_id', 'id']
          },
          {
            foreignKeyName: 'customer_notes_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          key: string
          label: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key: string
          label: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          key?: string
          label?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_outbox: {
        Row: {
          appointment_id: string | null
          attempts: number
          business_id: string
          channel: Database['public']['Enums']['notification_channel']
          created_at: string
          event_key: string
          id: string
          last_error: string | null
          next_attempt_at: string
          payload: Json
          processed_at: string | null
          recipient: string
          status: Database['public']['Enums']['notification_delivery_status']
        }
        Insert: {
          appointment_id?: string | null
          attempts?: number
          business_id: string
          channel: Database['public']['Enums']['notification_channel']
          created_at?: string
          event_key: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          recipient: string
          status?: Database['public']['Enums']['notification_delivery_status']
        }
        Update: {
          appointment_id?: string | null
          attempts?: number
          business_id?: string
          channel?: Database['public']['Enums']['notification_channel']
          created_at?: string
          event_key?: string
          id?: string
          last_error?: string | null
          next_attempt_at?: string
          payload?: Json
          processed_at?: string | null
          recipient?: string
          status?: Database['public']['Enums']['notification_delivery_status']
        }
        Relationships: [
          {
            foreignKeyName: 'notification_outbox_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      notification_templates: {
        Row: {
          body: string
          business_id: string
          channel: Database['public']['Enums']['notification_channel']
          created_at: string
          event_key: string
          id: string
          is_active: boolean
          subject: string | null
          updated_at: string
        }
        Insert: {
          body: string
          business_id: string
          channel: Database['public']['Enums']['notification_channel']
          created_at?: string
          event_key: string
          id?: string
          is_active?: boolean
          subject?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          business_id?: string
          channel?: Database['public']['Enums']['notification_channel']
          created_at?: string
          event_key?: string
          id?: string
          is_active?: boolean
          subject?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notification_templates_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          business_id: string
          created_at: string
          created_by: string
          currency: string
          customer_id: string | null
          external_reference: string | null
          id: string
          method: Database['public']['Enums']['payment_method']
          paid_at: string | null
          status: Database['public']['Enums']['payment_status']
          updated_at: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          business_id: string
          created_at?: string
          created_by: string
          currency?: string
          customer_id?: string | null
          external_reference?: string | null
          id?: string
          method: Database['public']['Enums']['payment_method']
          paid_at?: string | null
          status?: Database['public']['Enums']['payment_status']
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          business_id?: string
          created_at?: string
          created_by?: string
          currency?: string
          customer_id?: string | null
          external_reference?: string | null
          id?: string
          method?: Database['public']['Enums']['payment_method']
          paid_at?: string | null
          status?: Database['public']['Enums']['payment_status']
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'payments_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      platform_admins: {
        Row: {
          granted_at: string
          granted_by: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string
          business_id: string
          comment: string | null
          created_at: string
          customer_user_id: string
          id: string
          is_published: boolean
          rating: number
          updated_at: string
        }
        Insert: {
          appointment_id: string
          business_id: string
          comment?: string | null
          created_at?: string
          customer_user_id: string
          id?: string
          is_published?: boolean
          rating: number
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          business_id?: string
          comment?: string | null
          created_at?: string
          customer_user_id?: string
          id?: string
          is_published?: boolean
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reviews_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      services: {
        Row: {
          buffer_after_minutes: number
          buffer_before_minutes: number
          business_id: string
          created_at: string
          currency: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          business_id: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes: number
          id?: string
          is_active?: boolean
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          buffer_after_minutes?: number
          buffer_before_minutes?: number
          business_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'services_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      staff_profiles: {
        Row: {
          business_id: string
          created_at: string
          display_name: string
          id: string
          is_active: boolean
          is_bookable: boolean
          title: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          business_id: string
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean
          is_bookable?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          business_id?: string
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean
          is_bookable?: boolean
          title?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'staff_profiles_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          }
        ]
      }
      staff_services: {
        Row: {
          business_id: string
          created_at: string
          service_id: string
          staff_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          service_id: string
          staff_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          service_id?: string
          staff_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'staff_services_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'staff_services_business_id_service_id_fkey'
            columns: ['business_id', 'service_id']
            isOneToOne: false
            referencedRelation: 'services'
            referencedColumns: ['business_id', 'id']
          },
          {
            foreignKeyName: 'staff_services_business_id_staff_id_fkey'
            columns: ['business_id', 'staff_id']
            isOneToOne: false
            referencedRelation: 'staff_profiles'
            referencedColumns: ['business_id', 'id']
          }
        ]
      }
      staff_working_hours: {
        Row: {
          branch_id: string
          business_id: string
          created_at: string
          ends_at: string
          id: string
          is_active: boolean
          staff_id: string
          starts_at: string
          updated_at: string
          weekday: number
        }
        Insert: {
          branch_id: string
          business_id: string
          created_at?: string
          ends_at: string
          id?: string
          is_active?: boolean
          staff_id: string
          starts_at: string
          updated_at?: string
          weekday: number
        }
        Update: {
          branch_id?: string
          business_id?: string
          created_at?: string
          ends_at?: string
          id?: string
          is_active?: boolean
          staff_id?: string
          starts_at?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: 'staff_working_hours_business_id_branch_id_fkey'
            columns: ['business_id', 'branch_id']
            isOneToOne: false
            referencedRelation: 'branches'
            referencedColumns: ['business_id', 'id']
          },
          {
            foreignKeyName: 'staff_working_hours_business_id_fkey'
            columns: ['business_id']
            isOneToOne: false
            referencedRelation: 'businesses'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'staff_working_hours_business_id_staff_id_fkey'
            columns: ['business_id', 'staff_id']
            isOneToOne: false
            referencedRelation: 'staff_profiles'
            referencedColumns: ['business_id', 'id']
          }
        ]
      }
      subscription_plans: {
        Row: {
          code: string
          created_at: string
          currency: string
          id: string
          is_active: boolean
          limits: Json
          monthly_price: number
          name: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          limits?: Json
          monthly_price?: number
          name: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          limits?: Json
          monthly_price?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      change_appointment_status: {
        Args: {
          target_appointment_id: string
          target_reason?: string
          target_status: Database['public']['Enums']['appointment_status']
        }
        Returns: undefined
      }
      adjust_customer_loyalty: {
        Args: {
          target_business_id: string
          target_customer_id: string
          target_points_delta: number
          target_reason: string
        }
        Returns: number
      }
      create_business: {
        Args: {
          branch_name: string
          business_name: string
          business_slug: string
        }
        Returns: string
      }
      create_customer_appointment: {
        Args: {
          customer_email?: string
          customer_name: string
          customer_notes?: string
          customer_phone?: string
          target_branch_id: string
          target_business_slug: string
          target_service_id: string
          target_staff_id: string
          target_starts_at: string
        }
        Returns: string
      }
      get_public_availability: {
        Args: {
          target_branch_id: string
          target_business_slug: string
          target_date: string
          target_service_id: string
        }
        Returns: {
          ends_at: string
          staff_id: string
          staff_name: string
          starts_at: string
        }[]
      }
      queue_campaign: {
        Args: { target_campaign_id: string }
        Returns: number
      }
      get_business_report: {
        Args: {
          target_business_id: string
          target_from: string
          target_to: string
        }
        Returns: {
          appointment_count: number
          appointment_revenue: number
          average_rating: number | null
          collected_amount: number
          completed_count: number
        }[]
      }
      replace_staff_services: {
        Args: {
          target_business_id: string
          target_service_ids: string[]
          target_staff_id: string
        }
        Returns: undefined
      }
      reschedule_appointment: {
        Args: {
          target_appointment_id: string
          target_reason?: string
          target_starts_at: string
        }
        Returns: undefined
      }
    }
    Enums: {
      appointment_status:
        | 'PENDING'
        | 'CONFIRMED'
        | 'CHECKED_IN'
        | 'IN_PROGRESS'
        | 'COMPLETED'
        | 'CANCELLED'
        | 'REJECTED'
        | 'NO_SHOW'
        | 'EXPIRED'
      business_role: 'owner' | 'admin' | 'branch_manager' | 'receptionist' | 'staff'
      business_status: 'draft' | 'active' | 'suspended' | 'archived'
      notification_channel: 'email' | 'sms' | 'push'
      notification_delivery_status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled'
      payment_method: 'cash' | 'card' | 'bank_transfer' | 'other'
      payment_status: 'pending' | 'paid' | 'refunded' | 'void'
      subscription_status: 'trialing' | 'active' | 'past_due' | 'cancelled'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema['CompositeTypes'] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      appointment_status: [
        'PENDING',
        'CONFIRMED',
        'CHECKED_IN',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELLED',
        'REJECTED',
        'NO_SHOW',
        'EXPIRED'
      ],
      business_role: ['owner', 'admin', 'branch_manager', 'receptionist', 'staff'],
      business_status: ['draft', 'active', 'suspended', 'archived'],
      notification_channel: ['email', 'sms', 'push'],
      notification_delivery_status: ['pending', 'processing', 'sent', 'failed', 'cancelled'],
      payment_method: ['cash', 'card', 'bank_transfer', 'other'],
      payment_status: ['pending', 'paid', 'refunded', 'void'],
      subscription_status: ['trialing', 'active', 'past_due', 'cancelled']
    }
  }
} as const
