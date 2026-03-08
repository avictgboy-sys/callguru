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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ad_views: {
        Row: {
          ad_slot: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          ad_slot: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          ad_slot?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      badges: {
        Row: {
          badge_type: string
          created_at: string
          description: string | null
          icon: string
          id: string
          name: string
          points_required: number
        }
        Insert: {
          badge_type?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name: string
          points_required?: number
        }
        Update: {
          badge_type?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          name?: string
          points_required?: number
        }
        Relationships: []
      }
      calls: {
        Row: {
          caller_id: string
          created_at: string
          duration_minutes: number | null
          ended_at: string | null
          id: string
          platform_fee: number | null
          price_per_minute: number
          provider_earning: number | null
          provider_id: string
          recording_url: string | null
          service_id: string
          started_at: string
          status: string
          total_cost: number | null
        }
        Insert: {
          caller_id: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          platform_fee?: number | null
          price_per_minute: number
          provider_earning?: number | null
          provider_id: string
          recording_url?: string | null
          service_id: string
          started_at?: string
          status?: string
          total_cost?: number | null
        }
        Update: {
          caller_id?: string
          created_at?: string
          duration_minutes?: number | null
          ended_at?: string | null
          id?: string
          platform_fee?: number | null
          price_per_minute?: number
          provider_earning?: number | null
          provider_id?: string
          recording_url?: string | null
          service_id?: string
          started_at?: string
          status?: string
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "calls_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      chats: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          last_message_text: string | null
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          last_message_text?: string | null
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          admin_note: string | null
          against_id: string
          call_id: string
          complainant_id: string
          created_at: string
          details: string | null
          id: string
          reason: string
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          against_id: string
          call_id: string
          complainant_id: string
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          against_id?: string
          call_id?: string
          complainant_id?: string
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      group_members: {
        Row: {
          created_at: string
          group_id: string
          id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          group_id: string
          id?: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          group_id?: string
          id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      group_posts: {
        Row: {
          comments_count: number
          content: string | null
          created_at: string
          group_id: string
          id: string
          image_url: string | null
          likes_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content?: string | null
          created_at?: string
          group_id: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string | null
          created_at?: string
          group_id?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          id: string
          member_count: number
          name: string
          privacy: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          member_count?: number
          name: string
          privacy?: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          member_count?: number
          name?: string
          privacy?: string
          updated_at?: string
        }
        Relationships: []
      }
      home_bookings: {
        Row: {
          address: string | null
          advance_paid: number | null
          completed_at: string | null
          created_at: string
          customer_confirmed: boolean | null
          customer_id: string
          final_price: number | null
          hold_until: string | null
          id: string
          phone: string | null
          platform_fee: number | null
          preferred_date: string | null
          preferred_time: string | null
          pricing_type: string
          problem_description: string | null
          provider_earning: number | null
          provider_id: string
          quoted_price: number | null
          released: boolean | null
          remaining_paid: number | null
          service_id: string
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          advance_paid?: number | null
          completed_at?: string | null
          created_at?: string
          customer_confirmed?: boolean | null
          customer_id: string
          final_price?: number | null
          hold_until?: string | null
          id?: string
          phone?: string | null
          platform_fee?: number | null
          preferred_date?: string | null
          preferred_time?: string | null
          pricing_type?: string
          problem_description?: string | null
          provider_earning?: number | null
          provider_id: string
          quoted_price?: number | null
          released?: boolean | null
          remaining_paid?: number | null
          service_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          advance_paid?: number | null
          completed_at?: string | null
          created_at?: string
          customer_confirmed?: boolean | null
          customer_id?: string
          final_price?: number | null
          hold_until?: string | null
          id?: string
          phone?: string | null
          platform_fee?: number | null
          preferred_date?: string | null
          preferred_time?: string | null
          pricing_type?: string
          problem_description?: string | null
          provider_earning?: number | null
          provider_id?: string
          quoted_price?: number | null
          released?: boolean | null
          remaining_paid?: number | null
          service_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "home_services"
            referencedColumns: ["id"]
          },
        ]
      }
      home_service_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          name_bn: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_bn: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_bn?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      home_services: {
        Row: {
          area: string | null
          category_id: string
          created_at: string
          description: string | null
          fixed_price: number | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          max_price: number | null
          min_price: number | null
          pricing_type: string
          provider_id: string
          rating: number | null
          tags: string[] | null
          title: string
          total_jobs: number | null
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          area?: string | null
          category_id: string
          created_at?: string
          description?: string | null
          fixed_price?: number | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          max_price?: number | null
          min_price?: number | null
          pricing_type?: string
          provider_id: string
          rating?: number | null
          tags?: string[] | null
          title: string
          total_jobs?: number | null
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          area?: string | null
          category_id?: string
          created_at?: string
          description?: string | null
          fixed_price?: number | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          max_price?: number | null
          min_price?: number | null
          pricing_type?: string
          provider_id?: string
          rating?: number | null
          tags?: string[] | null
          title?: string
          total_jobs?: number | null
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "home_services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "home_service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      live_channels: {
        Row: {
          alternate_urls: string[] | null
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          sort_order: number | null
          stream_url: string
          updated_at: string
        }
        Insert: {
          alternate_urls?: string[] | null
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          sort_order?: number | null
          stream_url: string
          updated_at?: string
        }
        Update: {
          alternate_urls?: string[] | null
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          sort_order?: number | null
          stream_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          image_url: string | null
          sender_id: string
        }
        Insert: {
          chat_id: string
          content: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          sender_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          image_url?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "chats"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          resource_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          resource_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          resource_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_followers: {
        Row: {
          created_at: string
          id: string
          page_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_followers_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_posts: {
        Row: {
          comments_count: number
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          page_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          page_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          page_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_posts_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          avatar_url: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          follower_count: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          follower_count?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          follower_count?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_requests: {
        Row: {
          admin_note: string | null
          amount: number
          bank_details: Json | null
          created_at: string
          id: string
          method: string
          proof_url: string | null
          reference_id: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          bank_details?: Json | null
          created_at?: string
          id?: string
          method: string
          proof_url?: string | null
          reference_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          bank_details?: Json | null
          created_at?: string
          id?: string
          method?: string
          proof_url?: string | null
          reference_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      points_redemptions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          points_spent: number
          type: string
          user_id: string
          value: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          points_spent: number
          type: string
          user_id: string
          value?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          points_spent?: number
          type?: string
          user_id?: string
          value?: number | null
        }
        Relationships: []
      }
      posts: {
        Row: {
          comments_count: number
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          likes_count: number
          post_type: string
          shares_count: number
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_type?: string
          shares_count?: number
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          comments_count?: number
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          likes_count?: number
          post_type?: string
          shares_count?: number
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          followers_count: number
          following_count: number
          full_name: string | null
          id: string
          is_verified: boolean | null
          phone: string | null
          points: number | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
          user_id: string
          wallet_balance: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          followers_count?: number
          following_count?: number
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          points?: number | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id: string
          wallet_balance?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          followers_count?: number
          following_count?: number
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          points?: number | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
          user_id?: string
          wallet_balance?: number | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      reel_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_comments_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reel_likes: {
        Row: {
          created_at: string
          id: string
          reel_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reel_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reel_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reel_likes_reel_id_fkey"
            columns: ["reel_id"]
            isOneToOne: false
            referencedRelation: "reels"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          caption: string | null
          comments_count: number
          created_at: string
          id: string
          likes_count: number
          thumbnail_url: string | null
          user_id: string
          video_url: string
          views_count: number
        }
        Insert: {
          caption?: string | null
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          thumbnail_url?: string | null
          user_id: string
          video_url: string
          views_count?: number
        }
        Update: {
          caption?: string | null
          comments_count?: number
          created_at?: string
          id?: string
          likes_count?: number
          thumbnail_url?: string | null
          user_id?: string
          video_url?: string
          views_count?: number
        }
        Relationships: []
      }
      reviews: {
        Row: {
          call_id: string
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          reviewer_id: string
          service_id: string
        }
        Insert: {
          call_id: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          reviewer_id: string
          service_id: string
        }
        Update: {
          call_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          reviewer_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_call_id_fkey"
            columns: ["call_id"]
            isOneToOne: false
            referencedRelation: "calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      self_ads: {
        Row: {
          ad_type: string
          admin_note: string | null
          budget: number
          clicks: number
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          image_url: string | null
          impressions: number
          link_url: string | null
          spent: number
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          ad_type?: string
          admin_note?: string | null
          budget?: number
          clicks?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          link_url?: string | null
          spent?: number
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          ad_type?: string
          admin_note?: string | null
          budget?: number
          clicks?: number
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          image_url?: string | null
          impressions?: number
          link_url?: string | null
          spent?: number
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      service_categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      services: {
        Row: {
          availability_schedule: Json | null
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          price_per_minute: number
          provider_id: string
          rating: number | null
          tags: string[] | null
          title: string
          total_reviews: number | null
          total_sessions: number | null
          updated_at: string
        }
        Insert: {
          availability_schedule?: Json | null
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          price_per_minute: number
          provider_id: string
          rating?: number | null
          tags?: string[] | null
          title: string
          total_reviews?: number | null
          total_sessions?: number | null
          updated_at?: string
        }
        Update: {
          availability_schedule?: Json | null
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          price_per_minute?: number
          provider_id?: string
          rating?: number | null
          tags?: string[] | null
          title?: string
          total_reviews?: number | null
          total_sessions?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          badge_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_public: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          followers_count: number | null
          following_count: number | null
          full_name: string | null
          id: string | null
          is_verified: boolean | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          followers_count?: number | null
          following_count?: number | null
          full_name?: string | null
          id?: string | null
          is_verified?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      approve_payment_request: {
        Args: { p_admin_note?: string; p_request_id: string }
        Returns: undefined
      }
      complete_call: {
        Args: { p_call_id: string; p_duration_minutes: number }
        Returns: undefined
      }
      complete_home_booking: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_super_admin: { Args: { _user_id: string }; Returns: boolean }
      increment_reel_views: { Args: { p_reel_id: string }; Returns: undefined }
      mark_all_notifications_read: { Args: never; Returns: undefined }
      pay_home_booking_advance: {
        Args: { p_booking_id: string }
        Returns: undefined
      }
      reject_payment_request: {
        Args: { p_admin_note?: string; p_request_id: string }
        Returns: undefined
      }
      release_home_booking_payments: { Args: never; Returns: undefined }
      wallet_topup: { Args: { p_amount: number }; Returns: undefined }
      wallet_withdraw: { Args: { p_amount: number }; Returns: undefined }
    }
    Enums: {
      app_role: "user" | "provider" | "admin" | "super_admin"
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
      app_role: ["user", "provider", "admin", "super_admin"],
    },
  },
} as const
