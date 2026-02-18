
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
      clients: {
        Row: {
          address: string | null
          city: string | null
          contract_duration: number | null
          contract_end_date: string | null
          contract_start_date: string | null
          contract_value: number | null
          cpf: string | null
          created_at: string | null
          email: string | null
          id: number
          id_document_url: string | null
          income_proof_url: string | null
          locator_cpf: string | null
          locator_email: string | null
          locator_name: string | null
          locator_phone: string | null
          name: string | null
          payment_due_day: number | null
          phone: string | null
          proof_of_address_url: string | null
          property_interest: string | null
          state: string | null
          status: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contract_duration?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          id_document_url?: string | null
          income_proof_url?: string | null
          locator_cpf?: string | null
          locator_email?: string | null
          locator_name?: string | null
          locator_phone?: string | null
          name?: string | null
          payment_due_day?: number | null
          phone?: string | null
          proof_of_address_url?: string | null
          property_interest?: string | null
          state?: string | null
          status?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contract_duration?: number | null
          contract_end_date?: string | null
          contract_start_date?: string | null
          contract_value?: number | null
          cpf?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          id_document_url?: string | null
          income_proof_url?: string | null
          locator_cpf?: string | null
          locator_email?: string | null
          locator_name?: string | null
          locator_phone?: string | null
          name?: string | null
          payment_due_day?: number | null
          phone?: string | null
          proof_of_address_url?: string | null
          property_interest?: string | null
          state?: string | null
          status?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          city: string | null
          created_at: string | null
          email: string | null
          hours: string | null
          id: number
          number: string | null
          phone: string | null
          state: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          hours?: string | null
          id?: number
          number?: string | null
          phone?: string | null
          state?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string | null
          email?: string | null
          hours?: string | null
          id?: number
          number?: string | null
          phone?: string | null
          state?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
          message: string | null
          name: string | null
          phone: string | null
          property_id: string | null
          property_title: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
          phone?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
          message?: string | null
          name?: string | null
          phone?: string | null
          property_id?: string | null
          property_title?: string | null
          status?: string | null
        }
        Relationships: []
      }
      partners: {
        Row: {
          category: string | null
          contact: string | null
          created_at: string | null
          id: number
          name: string | null
        }
        Insert: {
          category?: string | null
          contact?: string | null
          created_at?: string | null
          id?: number
          name?: string | null
        }
        Update: {
          category?: string | null
          contact?: string | null
          created_at?: string | null
          id?: number
          name?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string | null
          complement: string | null
          condo_price: number | null
          created_at: string | null
          description: string | null
          fire_insurance: number | null
          furnished: boolean | null
          gallery_urls: string | null
          id: number
          image_url: string | null
          inspection_urls: string | null
          iptu_price: number | null
          neighborhood: string | null
          number: string | null
          operation: string | null
          owner_cpf: string | null
          owner_name: string | null
          owner_phone: string | null
          parking_spaces: number | null
          pets: boolean | null
          price: number | null
          service_charge: number | null
          state: string | null
          street: string | null
          title: string | null
          type: string | null
          zip: string | null
        }
        Insert: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          complement?: string | null
          condo_price?: number | null
          created_at?: string | null
          description?: string | null
          fire_insurance?: number | null
          furnished?: boolean | null
          gallery_urls?: string | null
          id?: number
          image_url?: string | null
          inspection_urls?: string | null
          iptu_price?: number | null
          neighborhood?: string | null
          number?: string | null
          operation?: string | null
          owner_cpf?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          parking_spaces?: number | null
          pets?: boolean | null
          price?: number | null
          service_charge?: number | null
          state?: string | null
          street?: string | null
          title?: string | null
          type?: string | null
          zip?: string | null
        }
        Update: {
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string | null
          complement?: string | null
          condo_price?: number | null
          created_at?: string | null
          description?: string | null
          fire_insurance?: number | null
          furnished?: boolean | null
          gallery_urls?: string | null
          id?: number
          image_url?: string | null
          inspection_urls?: string | null
          iptu_price?: number | null
          neighborhood?: string | null
          number?: string | null
          operation?: string | null
          owner_cpf?: string | null
          owner_name?: string | null
          owner_phone?: string | null
          parking_spaces?: number | null
          pets?: boolean | null
          price?: number | null
          service_charge?: number | null
          state?: string | null
          street?: string | null
          title?: string | null
          type?: string | null
          zip?: string | null
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
