
import { createClient } from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      properties: {
        Row: {
          id: number
          created_at: string
          title: string | null
          type: string | null
          operation: string | null
          price: number | null
          condo_price: number | null
          iptu_price: number | null
          city: string | null
          neighborhood: string | null
          street: string | null
          description: string | null
          bedrooms: number | null
          bathrooms: number | null
          parking_spaces: number | null
          area: number | null
          image_url: string | null
          gallery_urls: string | null
          inspection_urls: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          title?: string | null
          type?: string | null
          operation?: string | null
          price?: number | null
          condo_price?: number | null
          iptu_price?: number | null
          city?: string | null
          neighborhood?: string | null
          street?: string | null
          description?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          area?: number | null
          image_url?: string | null
          gallery_urls?: string | null
          inspection_urls?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          title?: string | null
          type?: string | null
          operation?: string | null
          price?: number | null
          condo_price?: number | null
          iptu_price?: number | null
          city?: string | null
          neighborhood?: string | null
          street?: string | null
          description?: string | null
          bedrooms?: number | null
          bathrooms?: number | null
          area?: number | null
          image_url?: string | null
          gallery_urls?: string | null
          inspection_urls?: string | null
        }
        Relationships: []
      }
      clients: {
        Row: {
          id: number
          created_at: string
          name: string | null
          cpf: string | null
          phone: string | null
          email: string | null
          property_interest: string | null
          status: string | null
          address: string | null
          city: string | null
          state: string | null
          zip: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name?: string | null
          cpf?: string | null
          phone?: string | null
          email?: string | null
          property_interest?: string | null
          status?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string | null
          cpf?: string | null
          phone?: string | null
          email?: string | null
          property_interest?: string | null
          status?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          id: number
          created_at: string
          name: string | null
          category: string | null
          contact: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name?: string | null
          category?: string | null
          contact?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string | null
          category?: string | null
          contact?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          id: number
          created_at: string
          address: string | null
          number: string | null
          city: string | null
          state: string | null
          zip: string | null
          phone: string | null
          email: string | null
          hours: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          address?: string | null
          number?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          phone?: string | null
          email?: string | null
          hours?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          address?: string | null
          number?: string | null
          city?: string | null
          state?: string | null
          zip?: string | null
          phone?: string | null
          email?: string | null
          hours?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: number
          created_at: string
          name: string | null
          email: string | null
          phone: string | null
          message: string | null
          property_id: string | null
          property_title: string | null
          status: string | null
        }
        Insert: {
          id?: number
          created_at?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          message?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string | null
        }
        Update: {
          id?: number
          created_at?: string
          name?: string | null
          email?: string | null
          phone?: string | null
          message?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
