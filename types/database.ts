export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          role: 'cashier' | 'manager' | 'admin'
          pin_hash: string
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          role: 'cashier' | 'manager' | 'admin'
          pin_hash: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          role?: 'cashier' | 'manager' | 'admin'
          pin_hash?: string
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      safe_drops: {
        Row: {
          id: string
          user_id: string
          amount: number
          timestamp: string
          shift_id: string | null
          receipt_number: string
          confirmed: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          timestamp?: string
          shift_id?: string | null
          receipt_number: string
          confirmed?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          timestamp?: string
          shift_id?: string | null
          receipt_number?: string
          confirmed?: boolean
          notes?: string | null
          created_at?: string
        }
      }
      withdrawals: {
        Row: {
          id: string
          user_id: string
          amount: number
          reason: string
          timestamp: string
          approved_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          amount: number
          reason: string
          timestamp?: string
          approved_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          amount?: number
          reason?: string
          timestamp?: string
          approved_by?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          vendor_id: string
          user_id: string
          amount: number
          payment_type: 'cash' | 'check'
          date: string
          notes: string | null
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          user_id: string
          amount: number
          payment_type: 'cash' | 'check'
          date: string
          notes?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          user_id?: string
          amount?: number
          payment_type?: 'cash' | 'check'
          date?: string
          notes?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      vendors: {
        Row: {
          id: string
          name: string
          type: 'vendor' | 'deposit_source'
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: 'vendor' | 'deposit_source'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: 'vendor' | 'deposit_source'
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      daily_sales: {
        Row: {
          id: string
          date: string
          card_sales: number
          cash_sales: number
          total_sales: number
          variance: number
          closed_by_user_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          date: string
          card_sales: number
          cash_sales: number
          total_sales: number
          variance?: number
          closed_by_user_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          date?: string
          card_sales?: number
          cash_sales?: number
          total_sales?: number
          variance?: number
          closed_by_user_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deposits: {
        Row: {
          id: string
          vendor_id: string
          amount: number
          date: string
          notes: string | null
          created_by_user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          amount: number
          date: string
          notes?: string | null
          created_by_user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          amount?: number
          date?: string
          notes?: string | null
          created_by_user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      manual_safe_counts: {
        Row: {
          id: string
          user_id: string
          expected_amount: number
          actual_amount: number
          variance: number
          timestamp: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          expected_amount: number
          actual_amount: number
          variance: number
          timestamp?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          expected_amount?: number
          actual_amount?: number
          variance?: number
          timestamp?: string
          notes?: string | null
          created_at?: string
        }
      }
      shifts: {
        Row: {
          id: string
          user_id: string
          start_time: string
          end_time: string | null
          starting_drawer_cash: number
          ending_drawer_cash: number | null
          total_drops: number
          total_expenses: number
          variance: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          start_time?: string
          end_time?: string | null
          starting_drawer_cash: number
          ending_drawer_cash?: number | null
          total_drops?: number
          total_expenses?: number
          variance?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          start_time?: string
          end_time?: string | null
          starting_drawer_cash?: number
          ending_drawer_cash?: number | null
          total_drops?: number
          total_expenses?: number
          variance?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      audit_log: {
        Row: {
          id: string
          table_name: string
          record_id: string
          action: 'insert' | 'update' | 'delete'
          old_value: Json | null
          new_value: Json | null
          changed_by_user: string
          changed_at: string
        }
        Insert: {
          id?: string
          table_name: string
          record_id: string
          action: 'insert' | 'update' | 'delete'
          old_value?: Json | null
          new_value?: Json | null
          changed_by_user: string
          changed_at?: string
        }
        Update: {
          id?: string
          table_name?: string
          record_id?: string
          action?: 'insert' | 'update' | 'delete'
          old_value?: Json | null
          new_value?: Json | null
          changed_by_user?: string
          changed_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          name: string
          code_hash: string
          hourly_rate: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code_hash: string
          hourly_rate?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code_hash?: string
          hourly_rate?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          employee_id: string
          clock_in: string
          clock_out: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          clock_in?: string
          clock_out?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          clock_in?: string
          clock_out?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      employee_expenses: {
        Row: {
          id: string
          employee_id: string
          amount: number
          description: string
          timestamp: string
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          amount: number
          description: string
          timestamp?: string
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          amount?: number
          description?: string
          timestamp?: string
          created_at?: string
        }
      }
      kiosk_keys: {
        Row: {
          id: string
          name: string
          key_hash: string
          active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          key_hash: string
          active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          key_hash?: string
          active?: boolean
          created_at?: string
        }
      }
      employee_paychecks: {
        Row: {
          id: string
          employee_id: string
          week_start: string
          week_end: string
          hours: number
          hourly_rate: number
          gross_pay: number
          expenses_total: number
          net_pay: number
          created_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          week_start: string
          week_end: string
          hours: number
          hourly_rate: number
          gross_pay: number
          expenses_total: number
          net_pay: number
          created_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          week_start?: string
          week_end?: string
          hours?: number
          hourly_rate?: number
          gross_pay?: number
          expenses_total?: number
          net_pay?: number
          created_at?: string
        }
      }
    }
  }
}

